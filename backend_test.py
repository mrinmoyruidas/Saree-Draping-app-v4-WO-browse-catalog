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
    def __init__(self, base_url="https://saree-fitter.preview.emergentagent.com"):
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
        """Test the main virtual try-on endpoint (NEW: No user photo required)"""
        print("\n🔍 Testing Virtual Try-On Endpoint (This may take up to 2 minutes)...")
        
        # Create test saree component images (NO USER PHOTO NEEDED)
        saree_body_base64 = self.create_test_image_base64(300, 400, (255, 0, 0))      # Red saree
        saree_pallu_base64 = self.create_test_image_base64(200, 300, (255, 215, 0))   # Gold pallu
        saree_border_base64 = self.create_test_image_base64(50, 400, (0, 0, 255))     # Blue border
        
        # Test 1: Full saree components (body + pallu + border)
        tryon_data_full = {
            "saree_body_base64": saree_body_base64,
            "saree_pallu_base64": saree_pallu_base64,
            "saree_border_base64": saree_border_base64,
            "pose_style": "front",
            "blouse_style": "traditional"
        }
        
        success, response = self.run_api_test("Virtual Try-On (Full Components)", "POST", "virtual-tryon", 200, tryon_data_full, timeout=120)
        
        tryon_id = None
        if success and response.get('id'):
            tryon_id = response['id']
            # Test get try-on result
            self.run_api_test("Get Try-On Result", "GET", f"tryon/{tryon_id}/base64", 200)
        
        # Test 2: Only saree body (minimal requirement)
        tryon_data_minimal = {
            "saree_body_base64": saree_body_base64,
            "pose_style": "side",
            "blouse_style": "modern"
        }
        
        self.run_api_test("Virtual Try-On (Body Only)", "POST", "virtual-tryon", 200, tryon_data_minimal, timeout=120)
        
        # Test 3: Different pose and blouse combinations
        tryon_data_back = {
            "saree_body_base64": saree_body_base64,
            "saree_pallu_base64": saree_pallu_base64,
            "pose_style": "back",
            "blouse_style": "sleeveless"
        }
        
        self.run_api_test("Virtual Try-On (Back Pose)", "POST", "virtual-tryon", 200, tryon_data_back, timeout=120)
        
        return tryon_id

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
        
        # Test virtual try-on without any saree data (should fail)
        self.run_api_test("Try-On No Saree Data", "POST", "virtual-tryon", 200, {
            "pose_style": "front",
            "blouse_style": "traditional"
        })
        
        # Test with invalid pose style
        saree_body_base64 = self.create_test_image_base64(300, 400, (255, 0, 0))
        self.run_api_test("Try-On Invalid Pose", "POST", "virtual-tryon", 200, {
            "saree_body_base64": saree_body_base64,
            "pose_style": "invalid_pose",
            "blouse_style": "traditional"
        })
        
        # Test with invalid blouse style
        self.run_api_test("Try-On Invalid Blouse", "POST", "virtual-tryon", 200, {
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
        virtual_tryon_working = any(r['name'] == 'Virtual Try-On Generation' and r['success'] for r in self.test_results)
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