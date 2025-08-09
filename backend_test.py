import requests
import sys
import os
from datetime import datetime
import json

class ThaiMedicalPlatformTester:
    def __init__(self, base_url="https://32288748-0514-4449-88fb-67be386d2bb8.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.doctor_token = None
        self.doctor_user_id = None
        self.shift_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in test_headers:
                        del test_headers['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_admin(self):
        """Test admin creation"""
        success, response = self.run_test(
            "Create Admin",
            "POST",
            "create-admin",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data={"email": "admin@doctorshift.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_doctor_registration(self):
        """Test doctor registration with file upload"""
        # Create a dummy image file for testing
        dummy_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        form_data = {
            'email': 'testdoctor@email.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'Doctor',
            'phone_number': '0812345678',
            'medical_license_number': 'MD001'
        }
        
        files = {
            'license_image': ('test_license.png', dummy_image_content, 'image/png')
        }
        
        success, response = self.run_test(
            "Doctor Registration",
            "POST",
            "register",
            200,
            data=form_data,
            files=files
        )
        
        if success and 'id' in response:
            self.doctor_user_id = response['id']
            print(f"   Doctor user ID: {self.doctor_user_id}")
            return True
        return False

    def test_doctor_login(self):
        """Test doctor login"""
        success, response = self.run_test(
            "Doctor Login",
            "POST",
            "login",
            200,
            data={"email": "testdoctor@email.com", "password": "password123"}
        )
        if success and 'access_token' in response:
            self.doctor_token = response['access_token']
            print(f"   Doctor token obtained: {self.doctor_token[:20]}...")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.doctor_token}'}
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "me",
            200,
            headers=headers
        )
        return success

    def test_get_pending_users_admin(self):
        """Test admin getting pending users"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Pending Users (Admin)",
            "GET",
            "admin/pending-users",
            200,
            headers=headers
        )
        return success

    def test_approve_user_admin(self):
        """Test admin approving a user"""
        if not self.admin_token or not self.doctor_user_id:
            print("❌ No admin token or doctor user ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Approve User (Admin)",
            "POST",
            f"admin/approve-user/{self.doctor_user_id}",
            200,
            headers=headers
        )
        return success

    def test_doctor_access_after_approval(self):
        """Test doctor accessing protected routes after approval"""
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.doctor_token}'}
        success, response = self.run_test(
            "Get My Shifts (After Approval)",
            "GET",
            "my-shifts",
            200,
            headers=headers
        )
        return success

    def test_create_shift(self):
        """Test creating a new shift"""
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.doctor_token}'}
        shift_data = {
            "position": "แพทย์ทั่วไป",
            "shift_date": "2025-08-15",
            "start_time": "08:00",
            "end_time": "16:00",
            "hospital_name": "โรงพยาบาลทดสอบ",
            "location": "กรุงเทพฯ",
            "compensation": 3000.0,
            "description": "เวรทดสอบระบบ",
            "requirements": "ต้องมีประสบการณ์",
            "contact_method": "แชทในแพลตฟอร์ม"
        }
        
        success, response = self.run_test(
            "Create Shift",
            "POST",
            "shifts",
            200,
            data=shift_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.shift_id = response['id']
            print(f"   Shift ID: {self.shift_id}")
            return True
        return False

    def test_get_all_shifts(self):
        """Test getting all shifts"""
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.doctor_token}'}
        success, response = self.run_test(
            "Get All Shifts",
            "GET",
            "shifts",
            200,
            headers=headers
        )
        return success

    def test_get_shifts_with_filters(self):
        """Test getting shifts with filters"""
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.doctor_token}'}
        success, response = self.run_test(
            "Get Shifts with Position Filter",
            "GET",
            "shifts?position=แพทย์ทั่วไป",
            200,
            headers=headers
        )
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "login",
            401,
            data={"email": "invalid@email.com", "password": "wrongpassword"}
        )
        return success

    def test_duplicate_registration(self):
        """Test registering with existing email"""
        dummy_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        form_data = {
            'email': 'testdoctor@email.com',  # Same email as before
            'password': 'password123',
            'first_name': 'Another',
            'last_name': 'Doctor',
            'phone_number': '0812345679',
            'medical_license_number': 'MD002'
        }
        
        files = {
            'license_image': ('test_license2.png', dummy_image_content, 'image/png')
        }
        
        success, response = self.run_test(
            "Duplicate Registration",
            "POST",
            "register",
            400,
            data=form_data,
            files=files
        )
        return success

def main():
    print("🏥 Starting Thai Medical Platform API Tests")
    print("=" * 60)
    
    tester = ThaiMedicalPlatformTester()
    
    # Test sequence
    tests = [
        ("Create Admin", tester.test_create_admin),
        ("Admin Login", tester.test_admin_login),
        ("Doctor Registration", tester.test_doctor_registration),
        ("Doctor Login", tester.test_doctor_login),
        ("Get Current User", tester.test_get_current_user),
        ("Get Pending Users (Admin)", tester.test_get_pending_users_admin),
        ("Approve User (Admin)", tester.test_approve_user_admin),
        ("Doctor Access After Approval", tester.test_doctor_access_after_approval),
        ("Create Shift", tester.test_create_shift),
        ("Get All Shifts", tester.test_get_all_shifts),
        ("Get Shifts with Filters", tester.test_get_shifts_with_filters),
        ("Invalid Login", tester.test_invalid_login),
        ("Duplicate Registration", tester.test_duplicate_registration),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())