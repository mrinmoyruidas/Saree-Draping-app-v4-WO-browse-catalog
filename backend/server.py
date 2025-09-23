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
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from openai import OpenAI
import io
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize OpenAI Image Generation
api_key = os.environ.get('EMERGENT_LLM_KEY')
if api_key and api_key != 'your_api_key_here':
    image_gen = OpenAIImageGeneration(api_key=api_key)
    # Also initialize direct OpenAI client for image editing
    openai_client = OpenAI(api_key=api_key)
else:
    image_gen = None
    openai_client = None
    logging.warning("EMERGENT_LLM_KEY not properly configured - AI image generation will use mock responses")

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
    saree_body_base64: Optional[str] = None
    saree_pallu_base64: Optional[str] = None
    saree_border_base64: Optional[str] = None
    saree_item_id: Optional[str] = None  # For catalog items
    pose_style: str = "front"  # "front", "side", "back"
    blouse_style: str = "traditional"  # "traditional", "modern", "sleeveless", "full_sleeve"
    model_type: str = "indian_woman"  # Type of AI model to generate
    session_id: Optional[str] = None  # Session ID for maintaining model consistency

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
        
        # Get the result image base64
        result_image_base64 = await process_virtual_tryon(request)
        
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


async def analyze_user_photo(user_photo_base64: str) -> str:
    """Analyze user photo to extract characteristics for virtual try-on"""
    if not user_photo_base64:
        return "- Indian woman with medium complexion\n- Natural features and professional appearance"
    
    # This is a simplified analysis - in a production app, you'd use computer vision
    # For now, we'll return a generic but detailed description
    return """- Indian woman with natural features and warm complexion
- Professional appearance suitable for saree modeling
- Appropriate body proportions for traditional Indian attire
- Natural pose and confident demeanor"""

async def analyze_saree_components(body_base64: str, pallu_base64: str, border_base64: str) -> str:
    """Analyze saree components to extract design details"""
    details = []
    
    if body_base64:
        details.append("- Main saree fabric with intricate traditional patterns")
        details.append("- Rich texture and authentic Indian craftsmanship")
    
    if pallu_base64:
        details.append("- Decorative pallu with ornate designs and detailing")
        details.append("- Traditional pallu styling meant to drape over the shoulder")
    
    if border_base64:
        details.append("- Elaborate border work with traditional motifs")
        details.append("- Contrasting border design that complements the main fabric")
    
    if not details:
        details = [
            "- Traditional saree with classic Indian patterns",
            "- Elegant fabric suitable for formal occasions",
            "- Authentic Indian craftsmanship and styling"
        ]
    
    return "\n".join(details)

async def generate_mock_tryon_image(request: TryOnRequest):
    """Generate a mock try-on image for testing when API key is not available"""
    logging.info(f"Generating mock try-on image for pose: {request.pose_style}, blouse: {request.blouse_style}")
    
    # Create a simple colored image as mock result with consistent dimensions
    width, height = 1024, 1536  # 2:3 aspect ratio for consistency
    
    # Choose color based on pose style
    colors = {
        "front": (255, 100, 100),  # Red
        "side": (100, 255, 100)    # Green  
    }
    
    color = colors.get(request.pose_style, (200, 200, 200))
    
    # Create mock image
    img = Image.new('RGB', (width, height), color)
    
    # Add some text to indicate it's a mock
    try:
        draw = ImageDraw.Draw(img)
        
        # Try to use default font
        try:
            font = ImageFont.load_default()
        except:
            font = None
            
        text = f"MOCK SAREE\n{request.pose_style.upper()}\n{request.blouse_style.upper()}"
        
        if font:
            draw.text((50, height//2 - 30), text, fill=(255, 255, 255), font=font)
        else:
            draw.text((50, height//2 - 30), text, fill=(255, 255, 255))
            
    except Exception as e:
        logging.warning(f"Could not add text to mock image: {e}")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_bytes = buffer.getvalue()
    
    return base64.b64encode(img_bytes).decode('utf-8')

async def process_virtual_tryon(request: TryOnRequest):
    """Process virtual try-on request and return base64 image"""
    # Validate pose and blouse styles
    valid_poses = ["front", "side"]  # Back view disabled per user request
    valid_blouses = ["traditional", "modern", "sleeveless", "full_sleeve"]
    
    if request.pose_style not in valid_poses:
        raise HTTPException(status_code=400, detail=f"Invalid pose_style. Must be one of: {valid_poses}")
    
    if request.blouse_style not in valid_blouses:
        raise HTTPException(status_code=400, detail=f"Invalid blouse_style. Must be one of: {valid_blouses}")
    
    # Check if we have API key for real AI generation
    if not api_key or api_key == 'your_api_key_here':
        logging.info("Using mock AI generation due to missing API key")
        return await generate_mock_tryon_image(request)
    
    # Prepare the prompt based on the pose style
    pose_descriptions = {
        "front": "front-facing pose with arms naturally by the sides, looking directly at camera",
        "side": "elegant side profile pose showing the saree draping, three-quarter turn"
    }
    
    blouse_descriptions = {
        "traditional": "traditional fitted blouse with short sleeves",
        "modern": "modern stylish blouse with contemporary cut",
        "sleeveless": "sleeveless blouse design",
        "full_sleeve": "full sleeve blouse with elegant design"
    }
    
    # Create comprehensive prompt for saree generation
    saree_description = ""
    if request.saree_item_id:
        # Get saree from catalog
        saree_item = await db.saree_catalog.find_one({"id": request.saree_item_id})
        if saree_item:
            saree_description = f"beautiful {saree_item['color']} saree with {saree_item['pattern']} pattern, {saree_item['description']}"
    else:
        saree_description = "beautiful traditional saree with intricate patterns and elegant border"
    
    # Generate AI model with saree using Nano Banana API
    try:
        logging.info("Starting AI model generation with saree components using Nano Banana API...")
        
        # Initialize Gemini chat for image generation with consistent parameters
        # Use provided session_id for consistency across multiple poses
        session_id = request.session_id or f"tryon_{uuid.uuid4()}"
        chat = LlmChat(
            api_key=api_key, 
            session_id=session_id, 
            system_message="You are an expert fashion AI that can generate realistic models wearing sarees. You can incorporate uploaded saree designs into photorealistic fashion photography. Always generate images with consistent dimensions and quality."
        )
        chat.with_model("gemini", "gemini-2.5-flash-image-preview").with_params(
            modalities=["image", "text"],
            # Add consistent image generation parameters
            image_generation_config={
                "width": 1024,
                "height": 1536,  # 2:3 aspect ratio for portrait fashion photography
                "quality": "high",
                "style": "photorealistic"
            }
        )
        
        # Prepare image contents for saree components if available
        image_contents = []
        saree_components_text = ""
        
        if request.saree_body_base64:
            image_contents.append(ImageContent(request.saree_body_base64))
            saree_components_text += "Use the main saree fabric pattern from the first uploaded image. "
            logging.info("Added saree body image for AI model generation")
            
        if request.saree_pallu_base64:
            image_contents.append(ImageContent(request.saree_pallu_base64))
            saree_components_text += "Use the decorative pallu design from the uploaded pallu image. "
            logging.info("Added saree pallu image for AI model generation")
            
        if request.saree_border_base64:
            image_contents.append(ImageContent(request.saree_border_base64))
            saree_components_text += "Use the border pattern from the uploaded border image. "
            logging.info("Added saree border image for AI model generation")
        
        # Create detailed prompt for AI model generation
        if image_contents:
            # Use uploaded saree components
            model_generation_prompt = f"""
            VIRTUAL SAREE MODEL GENERATION (Session: {session_id}):
            
            Create a photorealistic image of a beautiful Indian woman wearing a saree that incorporates the designs from the uploaded images.
            
            SPECIFIC REQUIREMENTS:
            1. Generate an elegant Indian woman model with natural features and warm complexion
            2. CONSISTENCY: If this is part of a multi-pose session, maintain the SAME MODEL appearance, facial features, skin tone, and body proportions
            3. BLOUSE CONSISTENCY: Use EXACTLY the same blouse color and design across all poses - {blouse_descriptions[request.blouse_style]} blouse
            4. HAIRSTYLE CONSISTENCY: Maintain the SAME hairstyle, hair length, hair color, and hair accessories across all poses
            5. {saree_components_text}
            6. Position her in a {pose_descriptions[request.pose_style]} pose
            7. Drape the saree authentically in traditional Indian style with proper pleats and pallu positioning
            8. Combine all uploaded saree elements (fabric, pallu, border) naturally into one beautiful saree with IDENTICAL patterns
            9. Professional fashion photography quality with studio lighting
            10. Clean neutral background (light gray or white) to highlight the saree
            11. Natural, elegant pose that showcases the saree beautifully
            12. CONSISTENT HIGH RESOLUTION: Generate image in exactly 1024x1536 pixels (2:3 aspect ratio)
            13. CONSISTENT QUALITY: High-definition photorealistic details with sharp focus
            14. The saree should look well-fitted and naturally draped
            15. Maintain authentic Indian saree draping traditions
            16. SAME PHOTOGRAPHY SESSION FEEL: Ensure lighting, background, and MODEL CONSISTENCY across poses
            17. CRITICAL: Keep the same woman's face, hair, blouse color, and saree pattern if generating multiple poses
            
            STYLE: High-end fashion photography, professional modeling, perfect lighting, sharp focus
            """
            
            # Create message with saree component images
            message = UserMessage(
                text=model_generation_prompt,
                file_contents=image_contents
            )
        else:
            # Generate without uploaded components (using catalog or description)
            model_generation_prompt = f"""
            Create a photorealistic image of a beautiful Indian woman wearing a {saree_description} in a {pose_descriptions[request.pose_style]} (Session: {session_id}).
            
            REQUIREMENTS:
            - Elegant Indian woman model with natural features and warm complexion
            - CONSISTENCY: If this is part of a multi-pose session, maintain the SAME MODEL appearance, facial features, skin tone, and body proportions
            - BLOUSE CONSISTENCY: Use EXACTLY the same blouse color and design - {blouse_descriptions[request.blouse_style]} blouse
            - HAIRSTYLE CONSISTENCY: Maintain the SAME hairstyle, hair length, hair color, and hair accessories
            - Drape the saree authentically in traditional Indian style with proper pleats and pallu positioning
            - Professional fashion photography quality with studio lighting
            - Clean neutral background to highlight the saree
            - Natural, elegant pose that showcases the saree beautifully
            - CONSISTENT DIMENSIONS: Generate image in exactly 1024x1536 pixels (2:3 aspect ratio)
            - CONSISTENT QUALITY: High-definition photorealistic details with sharp focus
            - The saree should look well-fitted and naturally draped
            - SAME PHOTOGRAPHY SESSION FEEL: Ensure lighting, background, and MODEL CONSISTENCY across poses
            - CRITICAL: Keep the same woman's face, hair, blouse color, and saree pattern if generating multiple poses
            
            STYLE: High-end fashion photography, professional modeling, perfect lighting
            """
            
            # Create text-only message
            message = UserMessage(text=model_generation_prompt)
        
        logging.info(f"Sending AI model generation request with {len(image_contents)} saree component images to Nano Banana API...")
        
        # Send to Gemini for model generation with saree
        text_response, generated_images = await chat.send_message_multimodal_response(message)
        
        if generated_images and len(generated_images) > 0:
            # Get the first generated image
            result_image_data = generated_images[0]['data']  # This is base64
            logging.info(f"Successfully generated AI model with saree via Nano Banana API")
            
            return result_image_data  # Return base64 directly
            
        else:
            logging.warning("No images returned from Nano Banana API, trying fallback...")
            raise Exception("No images generated from Nano Banana API")
            
    except Exception as nano_error:
        logging.error(f"Nano Banana API failed: {str(nano_error)}")
        
        # Fallback to OpenAI image generation
        logging.info("Using OpenAI fallback for AI model generation...")
        
        # Analyze saree components for fallback
        saree_design_details = await analyze_saree_components(
            request.saree_body_base64,
            request.saree_pallu_base64, 
            request.saree_border_base64
        )
        
        # Create fallback prompt
        fallback_prompt = f"""
        Create a highly realistic photograph of a beautiful Indian woman wearing a {saree_description} in a {pose_descriptions[request.pose_style]} (Session: {session_id}).
        
        MODEL CHARACTERISTICS:
        - Elegant Indian woman with natural features and warm complexion
        - Professional model appearance suitable for saree photography
        - Appropriate body proportions for traditional Indian attire
        - Confident and graceful demeanor
        - CONSISTENCY: If this is part of a multi-pose session, maintain the SAME MODEL appearance, facial features, skin tone, and body proportions
        - BLOUSE CONSISTENCY: Use EXACTLY the same blouse color and design - {blouse_descriptions[request.blouse_style]} blouse
        - HAIRSTYLE CONSISTENCY: Maintain the SAME hairstyle, hair length, hair color, and hair accessories
        
        SAREE DESIGN DETAILS:
        {saree_design_details}
        
        TECHNICAL REQUIREMENTS:
        - She should be wearing a {blouse_descriptions[request.blouse_style]} blouse
        - Drape the saree authentically in traditional Indian style with proper pleats and pallu positioning
        - Professional photography quality with studio lighting
        - Clean neutral background (light gray or white)
        - Natural, elegant pose that showcases the saree beautifully
        - High resolution (1024x1536) and photorealistic details
        - The saree should look well-fitted and naturally draped
        - Maintain authentic Indian saree draping traditions
        - SAME PHOTOGRAPHY SESSION FEEL: Ensure lighting, background, and MODEL CONSISTENCY across poses
        - IMPORTANT: Keep the same woman's face, hair, and physical characteristics if generating multiple poses
        
        STYLE: Professional fashion photography, high-end fashion shoot quality, perfect lighting, sharp focus
        """
        
        try:
            result_images = await image_gen.generate_images(
                prompt=fallback_prompt,
                model="gpt-image-1",
                number_of_images=1,
                # Add consistent dimensions for OpenAI fallback
                image_size="1024x1536"  # 2:3 aspect ratio
            )
            
            if not result_images or len(result_images) == 0:
                raise HTTPException(status_code=500, detail="Failed to generate AI model with saree")
            
            return base64.b64encode(result_images[0]).decode('utf-8')
            
        except Exception as fallback_error:
            logging.error(f"Fallback generation also failed: {str(fallback_error)}")
            raise HTTPException(status_code=500, detail=f"AI model generation failed: {str(fallback_error)}")

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
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
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
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
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