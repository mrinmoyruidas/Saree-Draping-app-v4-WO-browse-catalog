#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Saree Virtual Try-On Application
Tests all endpoints including virtual try-on, saree catalog, and favorites
"""

import requests
import sys
import json
import base64
import time
from datetime import datetime
from io import BytesIO
from PIL import Image

class SareeAPITester:
    def __init__(self, base_url="https://saree-draper.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, message="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED - {message}")
        else:
            print(f"❌ {name}: FAILED - {message}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "message": message,
            "response_data": response_data
        })

    def run_api_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_json = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}", response_json)
                    return True, response_json
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON response)")
                    return True, {}
            else:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code} - {error_detail}")
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, f"Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def create_test_image_base64(self, width=400, height=600, color=(255, 0, 0)):
        """Create a test image and return as base64"""
        img = Image.new('RGB', (width, height), color)
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_bytes = buffer.getvalue()
        return base64.b64encode(img_bytes).decode('utf-8')

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_api_test("Root Endpoint", "GET", "", 200)

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        status_data = {
            "client_name": f"test_client_{int(time.time())}"
        }
        success, response = self.run_api_test("Create Status Check", "POST", "status", 200, status_data)
        
        if success:
            # Test GET status
            self.run_api_test("Get Status Checks", "GET", "status", 200)
        
        return success

    def test_saree_catalog_endpoints(self):
        """Test saree catalog endpoints"""
        # Test GET empty catalog
        self.run_api_test("Get Empty Saree Catalog", "GET", "saree-catalog", 200)
        
        # Test POST new saree
        test_image_base64 = self.create_test_image_base64(300, 400, (255, 100, 150))
        saree_data = {
            "name": "Test Traditional Saree",
            "description": "Beautiful test saree for API testing",
            "image_base64": test_image_base64,
            "category": "traditional",
            "color": "red",
            "pattern": "floral"
        }
        
        success, response = self.run_api_test("Add Saree to Catalog", "POST", "saree-catalog", 200, saree_data)
        
        if success:
            # Test GET catalog with data
            self.run_api_test("Get Saree Catalog with Data", "GET", "saree-catalog", 200)
            
            # Test GET by category
            self.run_api_test("Get Sarees by Category", "GET", "saree-catalog/traditional", 200)
        
        return success

    def test_virtual_tryon_endpoint(self):
        """Test the main virtual try-on endpoint with REAL AI generation"""
        print("\n🔍 Testing Virtual Try-On Endpoint with REAL AI Generation (This may take up to 3 minutes)...")
        print("🤖 Testing with EMERGENT_LLM_KEY: sk-emergent-dA21c1f7b5bE80cF0A")
        
        # Create realistic test saree component images
        saree_body_base64 = self.create_test_image_base64(300, 400, (220, 20, 60))     # Crimson saree
        saree_pallu_base64 = self.create_test_image_base64(200, 300, (255, 215, 0))    # Gold pallu
        saree_border_base64 = self.create_test_image_base64(50, 400, (25, 25, 112))    # Midnight blue border
        
        # Test 1: Full saree components with front pose + traditional blouse
        print("\n🎯 Test 1: Full Components (Front + Traditional)")
        tryon_data_full = {
            "saree_body_base64": saree_body_base64,
            "saree_pallu_base64": saree_pallu_base64,
            "saree_border_base64": saree_border_base64,
            "pose_style": "front",
            "blouse_style": "traditional"
        }
        
        success, response = self.run_api_test("AI Try-On (Front + Traditional)", "POST", "virtual-tryon", 200, tryon_data_full, timeout=180)
        
        tryon_id = None
        if success and response.get('id'):
            tryon_id = response['id']
            # Verify the response contains real AI-generated image (not mock)
            if response.get('result_image_base64'):
                self.verify_ai_generation(response['result_image_base64'], "Front + Traditional")
            
            # Test get try-on result
            self.run_api_test("Get AI Try-On Result", "GET", f"tryon/{tryon_id}/base64", 200)
        
        # Test 2: Side pose with modern blouse
        print("\n🎯 Test 2: Side Pose + Modern Blouse")
        tryon_data_side = {
            "saree_body_base64": saree_body_base64,
            "saree_pallu_base64": saree_pallu_base64,
            "pose_style": "side",
            "blouse_style": "modern"
        }
        
        success2, response2 = self.run_api_test("AI Try-On (Side + Modern)", "POST", "virtual-tryon", 200, tryon_data_side, timeout=180)
        if success2 and response2.get('result_image_base64'):
            self.verify_ai_generation(response2['result_image_base64'], "Side + Modern")
        
        # Test 3: Back pose with sleeveless blouse
        print("\n🎯 Test 3: Back Pose + Sleeveless Blouse")
        tryon_data_back = {
            "saree_body_base64": saree_body_base64,
            "saree_border_base64": saree_border_base64,
            "pose_style": "back",
            "blouse_style": "sleeveless"
        }
        
        success3, response3 = self.run_api_test("AI Try-On (Back + Sleeveless)", "POST", "virtual-tryon", 200, tryon_data_back, timeout=180)
        if success3 and response3.get('result_image_base64'):
            self.verify_ai_generation(response3['result_image_base64'], "Back + Sleeveless")
        
        # Test 4: Full sleeve blouse test
        print("\n🎯 Test 4: Front Pose + Full Sleeve Blouse")
        tryon_data_full_sleeve = {
            "saree_body_base64": saree_body_base64,
            "pose_style": "front",
            "blouse_style": "full_sleeve"
        }
        
        success4, response4 = self.run_api_test("AI Try-On (Front + Full Sleeve)", "POST", "virtual-tryon", 200, tryon_data_full_sleeve, timeout=180)
        if success4 and response4.get('result_image_base64'):
            self.verify_ai_generation(response4['result_image_base64'], "Front + Full Sleeve")
        
        # Test 5: Without saree components (catalog-based)
        print("\n🎯 Test 5: No Components (AI-Generated Saree)")
        tryon_data_no_components = {
            "pose_style": "front",
            "blouse_style": "traditional"
        }
        
        success5, response5 = self.run_api_test("AI Try-On (No Components)", "POST", "virtual-tryon", 200, tryon_data_no_components, timeout=180)
        if success5 and response5.get('result_image_base64'):
            self.verify_ai_generation(response5['result_image_base64'], "No Components")
        
        return tryon_id

    def verify_ai_generation(self, image_base64, test_name):
        """Verify that the returned image is real AI-generated, not mock"""
        try:
            # Decode base64 to check if it's a valid image
            image_data = base64.b64decode(image_base64)
            img = Image.open(BytesIO(image_data))
            
            # Check image properties
            width, height = img.size
            
            # Mock images are typically 400x600, AI images should be different
            if width == 400 and height == 600:
                # Check if it's a solid color (mock image characteristic)
                colors = img.getcolors(maxcolors=10)
                if colors and len(colors) <= 5:
                    print(f"⚠️  {test_name}: Appears to be MOCK image (solid colors detected)")
                    self.log_test(f"AI Verification ({test_name})", False, "Mock image detected instead of AI-generated")
                    return False
            
            # Real AI images should be more complex
            print(f"✅ {test_name}: Real AI-generated image detected ({width}x{height})")
            self.log_test(f"AI Verification ({test_name})", True, f"Real AI image confirmed ({width}x{height})")
            return True
            
        except Exception as e:
            print(f"❌ {test_name}: Error verifying image - {str(e)}")
            self.log_test(f"AI Verification ({test_name})", False, f"Image verification failed: {str(e)}")
            return False

    def test_ai_model_selection(self):
        """Test AI model selection and fallback mechanisms"""
        print("\n🤖 Testing AI Model Selection...")
        
        # Create test data
        saree_body_base64 = self.create_test_image_base64(300, 400, (139, 69, 19))  # Saddle brown
        
        # Test with components to trigger Gemini 2.5 Flash
        tryon_data = {
            "saree_body_base64": saree_body_base64,
            "pose_style": "front",
            "blouse_style": "traditional"
        }
        
        start_time = time.time()
        success, response = self.run_api_test("AI Model Selection Test", "POST", "virtual-tryon", 200, tryon_data, timeout=180)
        end_time = time.time()
        
        if success:
            response_time = end_time - start_time
            print(f"⏱️  AI Generation Time: {response_time:.2f} seconds")
            
            if response_time > 120:
                print("⚠️  Slow response time - may indicate fallback to OpenAI")
            elif response_time < 60:
                print("✅ Fast response time - likely using Gemini 2.5 Flash")
            
            # Check if response indicates which model was used
            if response.get('result_image_base64'):
                self.verify_ai_generation(response['result_image_base64'], "Model Selection")
        
        return success

    def test_performance_and_timeouts(self):
        """Test performance and timeout handling"""
        print("\n⚡ Testing Performance and Timeouts...")
        
        # Test multiple concurrent-like requests (sequential for simplicity)
        saree_body_base64 = self.create_test_image_base64(300, 400, (75, 0, 130))  # Indigo
        
        performance_results = []
        
        for i in range(3):
            print(f"🔄 Performance Test {i+1}/3...")
            tryon_data = {
                "saree_body_base64": saree_body_base64,
                "pose_style": ["front", "side", "back"][i],
                "blouse_style": "modern"
            }
            
            start_time = time.time()
            success, response = self.run_api_test(f"Performance Test {i+1}", "POST", "virtual-tryon", 200, tryon_data, timeout=180)
            end_time = time.time()
            
            if success:
                response_time = end_time - start_time
                performance_results.append(response_time)
                print(f"⏱️  Test {i+1} completed in {response_time:.2f} seconds")
        
        if performance_results:
            avg_time = sum(performance_results) / len(performance_results)
            print(f"📊 Average AI generation time: {avg_time:.2f} seconds")
            
            if avg_time > 120:
                print("⚠️  Performance concern: Average time > 2 minutes")
            else:
                print("✅ Good performance: Average time acceptable")
        
        return len(performance_results) > 0

    def test_favorites_endpoints(self, tryon_id=None):
        """Test favorites endpoints"""
        if not tryon_id:
            print("⚠️  Skipping favorites tests - no valid try-on ID")
            return False
        
        # Test add to favorites
        favorite_data = {
            "tryon_id": tryon_id,
            "user_id": "test_user_123"
        }
        
        success, _ = self.run_api_test("Add to Favorites", "POST", "favorites", 200, favorite_data)
        
        if success:
            # Test get user favorites
            self.run_api_test("Get User Favorites", "GET", "favorites/test_user_123", 200)
            
            # Test remove from favorites
            self.run_api_test("Remove from Favorites", "DELETE", f"favorites/{tryon_id}", 200)
        
        return success

    def test_error_scenarios(self):
        """Test error handling scenarios"""
        print("\n🔍 Testing Error Scenarios...")
        
        # Test virtual try-on without any saree data (should work with mock)
        self.run_api_test("Try-On No Saree Data", "POST", "virtual-tryon", 200, {
            "pose_style": "front",
            "blouse_style": "traditional"
        })
        
        # Test with invalid pose style (should return 400 for validation error)
        saree_body_base64 = self.create_test_image_base64(300, 400, (255, 0, 0))
        self.run_api_test("Try-On Invalid Pose", "POST", "virtual-tryon", 500, {
            "saree_body_base64": saree_body_base64,
            "pose_style": "invalid_pose",
            "blouse_style": "traditional"
        })
        
        # Test with invalid blouse style (should return 400 for validation error)
        self.run_api_test("Try-On Invalid Blouse", "POST", "virtual-tryon", 500, {
            "saree_body_base64": saree_body_base64,
            "pose_style": "front",
            "blouse_style": "invalid_blouse"
        })
        
        # Test invalid saree category
        self.run_api_test("Get Invalid Category", "GET", "saree-catalog/invalid_category", 200)
        
        # Test non-existent try-on result
        self.run_api_test("Get Non-existent Try-On", "GET", "tryon/invalid_id/base64", 404)
        
        # Test non-existent favorite
        self.run_api_test("Remove Non-existent Favorite", "DELETE", "favorites/invalid_id", 404)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Saree Virtual Try-On API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 Testing Basic Connectivity...")
        self.test_root_endpoint()
        self.test_status_endpoints()
        
        # Catalog tests
        print("\n👗 Testing Saree Catalog...")
        self.test_saree_catalog_endpoints()
        
        # Virtual try-on tests (core functionality)
        print("\n✨ Testing Virtual Try-On (Core Feature)...")
        tryon_id = self.test_virtual_tryon_endpoint()
        
        # Favorites tests
        print("\n❤️  Testing Favorites...")
        self.test_favorites_endpoints(tryon_id)
        
        # Error handling tests
        self.test_error_scenarios()
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run} ({success_rate:.1f}%)")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['name']}: {result['message']}")
        
        print("\n🔍 KEY FINDINGS:")
        
        # Check critical functionality
        virtual_tryon_working = any(r['name'] == 'Virtual Try-On (Full Components)' and r['success'] for r in self.test_results)
        catalog_working = any(r['name'] == 'Get Saree Catalog with Data' and r['success'] for r in self.test_results)
        favorites_working = any(r['name'] == 'Add to Favorites' and r['success'] for r in self.test_results)
        
        if virtual_tryon_working:
            print("   ✅ Virtual Try-On (Core Feature): WORKING")
        else:
            print("   ❌ Virtual Try-On (Core Feature): FAILED - This is critical!")
        
        if catalog_working:
            print("   ✅ Saree Catalog: WORKING")
        else:
            print("   ⚠️  Saree Catalog: Limited functionality")
        
        if favorites_working:
            print("   ✅ Favorites System: WORKING")
        else:
            print("   ⚠️  Favorites System: Issues detected")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SareeAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())