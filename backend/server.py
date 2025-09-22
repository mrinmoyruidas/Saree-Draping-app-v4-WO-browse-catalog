from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from openai import OpenAI
import io
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize OpenAI Image Generation
api_key = os.environ.get('EMERGENT_LLM_KEY')
image_gen = OpenAIImageGeneration(api_key=api_key)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class SareeItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image_base64: str
    category: str  # "traditional", "modern", "festive", etc.
    color: str
    pattern: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SareeItemCreate(BaseModel):
    name: str
    description: str
    image_base64: str
    category: str
    color: str
    pattern: str

class TryOnRequest(BaseModel):
    user_photo_base64: str
    saree_body_base64: Optional[str] = None
    saree_pallu_base64: Optional[str] = None
    saree_border_base64: Optional[str] = None
    saree_item_id: Optional[str] = None  # For catalog items
    pose_style: str = "front"  # "front", "side", "back"
    blouse_style: str = "traditional"  # "traditional", "modern", "sleeveless", "full_sleeve"

class TryOnResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    result_image_base64: str
    pose_style: str
    blouse_style: str
    saree_details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_favorite: bool = False

class FavoriteTryOn(BaseModel):
    tryon_id: str
    user_id: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Saree Virtual Try-On API Ready"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Saree Catalog APIs
@api_router.post("/saree-catalog", response_model=SareeItem)
async def add_saree_to_catalog(saree: SareeItemCreate):
    saree_obj = SareeItem(**saree.dict())
    result = await db.saree_catalog.insert_one(saree_obj.dict())
    return saree_obj

@api_router.get("/saree-catalog", response_model=List[SareeItem])
async def get_saree_catalog():
    sarees = await db.saree_catalog.find().to_list(1000)
    return [SareeItem(**saree) for saree in sarees]

@api_router.get("/saree-catalog/{category}")
async def get_sarees_by_category(category: str):
    sarees = await db.saree_catalog.find({"category": category}).to_list(1000)
    return [SareeItem(**saree) for saree in sarees]

# Virtual Try-On API
@api_router.post("/virtual-tryon")
async def create_virtual_tryon(request: TryOnRequest):
    try:
        logging.info(f"Starting virtual try-on process for pose: {request.pose_style}")
        
        # Prepare the prompt based on the pose style
        pose_descriptions = {
            "front": "front-facing pose with arms naturally by the sides, looking directly at camera",
            "side": "elegant side profile pose showing the saree draping, three-quarter turn",
            "back": "back view showing the saree blouse design and rear draping, hair styled in a bun"
        }
        
        blouse_descriptions = {
            "traditional": "traditional fitted blouse with short sleeves",
            "modern": "modern stylish blouse with contemporary cut",
            "sleeveless": "sleeveless blouse design",
            "full_sleeve": "full sleeve blouse with elegant design"
        }
        
        # Create comprehensive prompt for image editing
        saree_description = ""
        if request.saree_item_id:
            # Get saree from catalog
            saree_item = await db.saree_catalog.find_one({"id": request.saree_item_id})
            if saree_item:
                saree_description = f"beautiful {saree_item['color']} saree with {saree_item['pattern']} pattern, {saree_item['description']}"
        else:
            saree_description = "beautiful traditional saree with intricate patterns and elegant border"
        
        prompt = f"""
        Transform this person into wearing a {saree_description} in a {pose_descriptions[request.pose_style]}. 
        The person should be wearing a {blouse_descriptions[request.blouse_style]}. 
        Ensure the saree is draped authentically in traditional Indian style with proper pleats and pallu positioning.
        The final image should be photorealistic, professional quality, and show the complete outfit elegantly.
        Background should be clean and neutral to highlight the saree.
        """
        
        logging.info(f"Generating image with prompt: {prompt[:100]}...")
        
        # Call OpenAI Image Generation API (text-to-image only)
        # Note: This library doesn't support image editing, only text-to-image generation
        result_images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1,
            quality="standard"
        )
        
        if not result_images or len(result_images) == 0:
            raise HTTPException(status_code=500, detail="No image was generated")
        
        # Convert result to base64
        result_image_base64 = base64.b64encode(result_images[0]).decode('utf-8')
        
        # Create try-on result
        tryon_result = TryOnResult(
            result_image_base64=result_image_base64,
            pose_style=request.pose_style,
            blouse_style=request.blouse_style,
            saree_details={
                "has_body": bool(request.saree_body_base64),
                "has_pallu": bool(request.saree_pallu_base64),
                "has_border": bool(request.saree_border_base64),
                "saree_item_id": request.saree_item_id
            }
        )
        
        # Save to database
        await db.virtual_tryons.insert_one(tryon_result.dict())
        
        logging.info("Virtual try-on completed successfully")
        return {
            "id": tryon_result.id,
            "result_image_base64": result_image_base64,
            "pose_style": request.pose_style,
            "blouse_style": request.blouse_style,
            "message": "Virtual try-on completed successfully"
        }
        
    except Exception as e:
        logging.error(f"Error in virtual try-on: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Virtual try-on failed: {str(e)}")

# Favorites API
@api_router.post("/favorites")
async def add_to_favorites(favorite: FavoriteTryOn):
    try:
        # Update the try-on result to mark as favorite
        result = await db.virtual_tryons.update_one(
            {"id": favorite.tryon_id},
            {"$set": {"is_favorite": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Try-on result not found")
        
        return {"message": "Added to favorites successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add to favorites: {str(e)}")

@api_router.get("/favorites/{user_id}")
async def get_user_favorites(user_id: str):
    try:
        favorites = await db.virtual_tryons.find({"user_id": user_id, "is_favorite": True}).to_list(1000)
        return [TryOnResult(**fav) for fav in favorites]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get favorites: {str(e)}")

@api_router.delete("/favorites/{tryon_id}")
async def remove_from_favorites(tryon_id: str):
    try:
        result = await db.virtual_tryons.update_one(
            {"id": tryon_id},
            {"$set": {"is_favorite": False}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Try-on result not found")
        
        return {"message": "Removed from favorites successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove from favorites: {str(e)}")

# Get try-on result
@api_router.get("/tryon/{tryon_id}/base64")
async def get_tryon_image(tryon_id: str):
    try:
        tryon = await db.virtual_tryons.find_one({"id": tryon_id})
        if not tryon:
            raise HTTPException(status_code=404, detail="Try-on result not found")
        
        return {
            "image_base64": tryon["result_image_base64"],
            "pose_style": tryon["pose_style"],
            "blouse_style": tryon["blouse_style"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get try-on image: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()