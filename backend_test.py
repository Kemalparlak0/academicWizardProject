#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AcademicWizardAPITester:
    def __init__(self, base_url="https://academic-wizard.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_init_data(self):
        """Initialize talismans data"""
        print("\n🔧 Initializing data...")
        success, response = self.run_test(
            "Initialize Talismans Data",
            "POST",
            "init-data",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        print("\n👤 Testing Authentication...")
        timestamp = datetime.now().strftime("%H%M%S")
        test_user_data = {
            "username": f"test_wizard_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   📝 Registered user: {test_user_data['username']}")
            return True, test_user_data
        return False, test_user_data

    def test_login(self, user_data):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": user_data["email"],
                "password": user_data["password"]
            }
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_profile(self):
        """Test get user profile"""
        print("\n👤 Testing User Profile...")
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        return success

    def test_user_stats(self):
        """Test get user stats"""
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            "user/stats",
            200
        )
        return success

    def test_spell_operations(self):
        """Test spell CRUD operations"""
        print("\n🪄 Testing Spell Operations...")
        
        # Create spell
        spell_data = {
            "title": "Test Meditation Spell",
            "description": "Daily meditation practice for inner peace",
            "repeatType": "DAILY",
            "xpReward": 15
        }
        
        success, response = self.run_test(
            "Create Spell",
            "POST",
            "spells",
            200,
            data=spell_data
        )
        
        if not success:
            return False
        
        spell_id = response.get('id')
        if not spell_id:
            self.log_test("Create Spell - Get ID", False, "No spell ID returned")
            return False
        
        # Get spells
        success, spells = self.run_test(
            "Get User Spells",
            "GET",
            "spells",
            200
        )
        
        if not success:
            return False
        
        # Update spell
        update_data = {
            "title": "Updated Meditation Spell",
            "xpReward": 20
        }
        
        success, response = self.run_test(
            "Update Spell",
            "PUT",
            f"spells/{spell_id}",
            200,
            data=update_data
        )
        
        if not success:
            return False
        
        # Complete spell
        success, response = self.run_test(
            "Complete Spell",
            "POST",
            f"spells/{spell_id}/complete",
            200
        )
        
        if success:
            xp_gained = response.get('xpGained', 0)
            new_level = response.get('newLevel', 1)
            print(f"   ✨ Gained {xp_gained} XP, reached level {new_level}")
        
        # Try to complete same spell again (should fail)
        success, response = self.run_test(
            "Complete Spell Again (Should Fail)",
            "POST",
            f"spells/{spell_id}/complete",
            400
        )
        
        # This should fail, so success=False is expected
        if not success:
            self.log_test("Complete Spell Again (Expected Failure)", True, "Correctly prevented duplicate completion")
        else:
            self.log_test("Complete Spell Again (Expected Failure)", False, "Should have prevented duplicate completion")
        
        # Delete spell
        success, response = self.run_test(
            "Delete Spell",
            "DELETE",
            f"spells/{spell_id}",
            200
        )
        
        return True

    def test_talismans(self):
        """Test talisman operations"""
        print("\n🏆 Testing Talisman Operations...")
        
        # Get all talismans
        success, response = self.run_test(
            "Get All Talismans",
            "GET",
            "talismans",
            200
        )
        
        if not success:
            return False
        
        # Get user talismans
        success, response = self.run_test(
            "Get User Talismans",
            "GET",
            "user/talismans",
            200
        )
        
        return success

    def test_leaderboard(self):
        """Test leaderboard"""
        print("\n🏅 Testing Leaderboard...")
        
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard?limit=10",
            200
        )
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🧙‍♂️ Starting Academic Wizard API Tests...")
        print(f"🔗 Testing API: {self.base_url}")
        
        # Initialize data first
        if not self.test_init_data():
            print("❌ Failed to initialize data, continuing with tests...")
        
        # Test registration and login
        reg_success, user_data = self.test_register()
        if not reg_success:
            print("❌ Registration failed, stopping tests")
            return False
        
        if not self.test_login(user_data):
            print("❌ Login failed, stopping tests")
            return False
        
        # Test user operations
        self.test_user_profile()
        self.test_user_stats()
        
        # Test spell operations
        self.test_spell_operations()
        
        # Test talismans
        self.test_talismans()
        
        # Test leaderboard
        self.test_leaderboard()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            return False

def main():
    tester = AcademicWizardAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())