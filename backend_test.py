#!/usr/bin/env python3
"""
Backend Test Suite for Enhanced Settings Page Functionality
Tests Supabase integration for Settings page features
"""

import requests
import json
import time
import os
from typing import Dict, Any, Optional

class SettingsBackendTester:
    def __init__(self):
        self.base_url = "http://localhost:3001"
        self.supabase_url = "https://dfzspjqgvdzosrddqcje.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNwanFndmR6b3NyZGRxY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODc4MTEsImV4cCI6MjA2OTU2MzgxMX0.XGwGU6VEftwzqqWM5b_r6F42qrjBtw4a1Saq4LB_-HU"
        self.test_results = []
        self.session_token = None
        self.test_user_id = None
        
    def log_result(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    def test_supabase_connection(self):
        """Test Supabase connection and configuration"""
        try:
            # Test Supabase REST API endpoint
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.supabase_anon_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.supabase_url}/rest/v1/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_result(
                    "Supabase Connection",
                    True,
                    "Successfully connected to Supabase",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_result(
                    "Supabase Connection",
                    False,
                    f"Failed to connect to Supabase: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Supabase Connection",
                False,
                f"Connection error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_database_schema(self):
        """Test if required database tables exist"""
        try:
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.supabase_anon_key}",
                "Content-Type": "application/json"
            }
            
            required_tables = ["users", "user_settings", "user_devices", "companies"]
            schema_results = {}
            
            for table in required_tables:
                try:
                    response = requests.get(
                        f"{self.supabase_url}/rest/v1/{table}?limit=1",
                        headers=headers,
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        schema_results[table] = "EXISTS"
                    elif response.status_code == 404:
                        schema_results[table] = "NOT_FOUND"
                    else:
                        schema_results[table] = f"ERROR_{response.status_code}"
                        
                except Exception as e:
                    schema_results[table] = f"ERROR: {str(e)}"
            
            all_exist = all(status == "EXISTS" for status in schema_results.values())
            
            self.log_result(
                "Database Schema Check",
                all_exist,
                "All required tables exist" if all_exist else "Some tables missing",
                schema_results
            )
            
            return all_exist
            
        except Exception as e:
            self.log_result(
                "Database Schema Check",
                False,
                f"Schema check failed: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_user_authentication(self):
        """Test user authentication with Supabase"""
        try:
            # Test signup first
            signup_data = {
                "email": "testuser@mailoreply.com",
                "password": "testpass123",
                "data": {
                    "name": "Test User"
                }
            }
            
            headers = {
                "apikey": self.supabase_anon_key,
                "Content-Type": "application/json"
            }
            
            # Try to sign up
            response = requests.post(
                f"{self.supabase_url}/auth/v1/signup",
                headers=headers,
                json=signup_data,
                timeout=10
            )
            
            if response.status_code in [200, 400]:  # 400 might mean user already exists
                # Try to sign in
                signin_data = {
                    "email": "testuser@mailoreply.com",
                    "password": "testpass123"
                }
                
                response = requests.post(
                    f"{self.supabase_url}/auth/v1/token?grant_type=password",
                    headers=headers,
                    json=signin_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    auth_data = response.json()
                    self.session_token = auth_data.get("access_token")
                    self.test_user_id = auth_data.get("user", {}).get("id")
                    
                    self.log_result(
                        "User Authentication",
                        True,
                        "Successfully authenticated test user",
                        {"user_id": self.test_user_id[:8] + "..." if self.test_user_id else None}
                    )
                    return True
                else:
                    self.log_result(
                        "User Authentication",
                        False,
                        f"Authentication failed: {response.status_code}",
                        {"response": response.text[:200]}
                    )
                    return False
            else:
                self.log_result(
                    "User Authentication",
                    False,
                    f"Signup failed: {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "User Authentication",
                False,
                f"Authentication error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_password_change_functionality(self):
        """Test password change functionality"""
        if not self.session_token:
            self.log_result(
                "Password Change Test",
                False,
                "No authentication token available",
                {}
            )
            return False
        
        try:
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            # Test password update
            password_data = {
                "password": "newtestpass123"
            }
            
            response = requests.put(
                f"{self.supabase_url}/auth/v1/user",
                headers=headers,
                json=password_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_result(
                    "Password Change Test",
                    True,
                    "Password change endpoint working",
                    {"status_code": response.status_code}
                )
                
                # Test validation - try with short password
                short_password_data = {"password": "123"}
                response = requests.put(
                    f"{self.supabase_url}/auth/v1/user",
                    headers=headers,
                    json=short_password_data,
                    timeout=10
                )
                
                # Should fail validation
                if response.status_code != 200:
                    self.log_result(
                        "Password Validation Test",
                        True,
                        "Password validation working (short password rejected)",
                        {"status_code": response.status_code}
                    )
                else:
                    self.log_result(
                        "Password Validation Test",
                        False,
                        "Password validation not working (short password accepted)",
                        {"status_code": response.status_code}
                    )
                
                return True
            else:
                self.log_result(
                    "Password Change Test",
                    False,
                    f"Password change failed: {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Password Change Test",
                False,
                f"Password change error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_user_profile_updates(self):
        """Test user profile update functionality"""
        if not self.session_token or not self.test_user_id:
            self.log_result(
                "User Profile Update Test",
                False,
                "No authentication token or user ID available",
                {}
            )
            return False
        
        try:
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Test user profile update
            profile_data = {
                "name": "Updated Test User",
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
            
            response = requests.patch(
                f"{self.supabase_url}/rest/v1/users?id=eq.{self.test_user_id}",
                headers=headers,
                json=profile_data,
                timeout=10
            )
            
            if response.status_code in [200, 204]:
                self.log_result(
                    "User Profile Update Test",
                    True,
                    "User profile update working",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_result(
                    "User Profile Update Test",
                    False,
                    f"Profile update failed: {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "User Profile Update Test",
                False,
                f"Profile update error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_user_settings_persistence(self):
        """Test user settings data persistence"""
        if not self.session_token or not self.test_user_id:
            self.log_result(
                "User Settings Persistence Test",
                False,
                "No authentication token or user ID available",
                {}
            )
            return False
        
        try:
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Test creating/updating user settings
            settings_data = {
                "user_id": self.test_user_id,
                "default_language": "Spanish",
                "default_tone": "Friendly",
                "always_encrypt": True,
                "encryption_enabled": True,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
            
            # Try to upsert settings
            response = requests.post(
                f"{self.supabase_url}/rest/v1/user_settings",
                headers=headers,
                json=settings_data,
                timeout=10
            )
            
            if response.status_code in [200, 201, 409]:  # 409 might be conflict if exists
                # Try to update existing settings
                update_data = {
                    "default_language": "French",
                    "always_encrypt": False,
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                }
                
                response = requests.patch(
                    f"{self.supabase_url}/rest/v1/user_settings?user_id=eq.{self.test_user_id}",
                    headers=headers,
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code in [200, 204]:
                    self.log_result(
                        "User Settings Persistence Test",
                        True,
                        "User settings persistence working",
                        {"status_code": response.status_code}
                    )
                    return True
                else:
                    self.log_result(
                        "User Settings Persistence Test",
                        False,
                        f"Settings update failed: {response.status_code}",
                        {"response": response.text[:200]}
                    )
                    return False
            else:
                self.log_result(
                    "User Settings Persistence Test",
                    False,
                    f"Settings creation failed: {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "User Settings Persistence Test",
                False,
                f"Settings persistence error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_device_management(self):
        """Test device management functionality"""
        if not self.session_token or not self.test_user_id:
            self.log_result(
                "Device Management Test",
                False,
                "No authentication token or user ID available",
                {}
            )
            return False
        
        try:
            headers = {
                "apikey": self.supabase_anon_key,
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Test device registration
            device_data = {
                "user_id": self.test_user_id,
                "device_fingerprint": "test_device_123",
                "device_name": "Test Chrome Browser",
                "last_active": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            }
            
            response = requests.post(
                f"{self.supabase_url}/rest/v1/user_devices",
                headers=headers,
                json=device_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                device_id = None
                if response.text:
                    try:
                        device_response = response.json()
                        if isinstance(device_response, list) and len(device_response) > 0:
                            device_id = device_response[0].get("id")
                    except:
                        pass
                
                # Test device listing
                response = requests.get(
                    f"{self.supabase_url}/rest/v1/user_devices?user_id=eq.{self.test_user_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    devices = response.json()
                    if isinstance(devices, list) and len(devices) > 0:
                        if not device_id:
                            device_id = devices[0].get("id")
                        
                        self.log_result(
                            "Device Listing Test",
                            True,
                            f"Device listing working - found {len(devices)} device(s)",
                            {"device_count": len(devices)}
                        )
                        
                        # Test device removal if we have a device ID
                        if device_id:
                            response = requests.delete(
                                f"{self.supabase_url}/rest/v1/user_devices?id=eq.{device_id}",
                                headers=headers,
                                timeout=10
                            )
                            
                            if response.status_code in [200, 204]:
                                self.log_result(
                                    "Device Removal Test",
                                    True,
                                    "Device removal working",
                                    {"status_code": response.status_code}
                                )
                            else:
                                self.log_result(
                                    "Device Removal Test",
                                    False,
                                    f"Device removal failed: {response.status_code}",
                                    {"response": response.text[:200]}
                                )
                        
                        return True
                    else:
                        self.log_result(
                            "Device Listing Test",
                            False,
                            "No devices found after registration",
                            {"devices": devices}
                        )
                        return False
                else:
                    self.log_result(
                        "Device Listing Test",
                        False,
                        f"Device listing failed: {response.status_code}",
                        {"response": response.text[:200]}
                    )
                    return False
            else:
                self.log_result(
                    "Device Management Test",
                    False,
                    f"Device registration failed: {response.status_code}",
                    {"response": response.text[:200]}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Device Management Test",
                False,
                f"Device management error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def test_frontend_settings_page(self):
        """Test if Settings page loads correctly"""
        try:
            response = requests.get(f"{self.base_url}/settings", timeout=10)
            
            if response.status_code == 200:
                # Check if page contains expected elements
                content = response.text.lower()
                expected_elements = [
                    "settings",
                    "profile",
                    "password",
                    "preferences",
                    "security",
                    "devices"
                ]
                
                found_elements = [elem for elem in expected_elements if elem in content]
                
                if len(found_elements) >= 4:  # At least 4 out of 6 elements
                    self.log_result(
                        "Frontend Settings Page Test",
                        True,
                        f"Settings page loads with expected elements",
                        {"found_elements": found_elements}
                    )
                    return True
                else:
                    self.log_result(
                        "Frontend Settings Page Test",
                        False,
                        f"Settings page missing expected elements",
                        {"found_elements": found_elements, "expected": expected_elements}
                    )
                    return False
            else:
                self.log_result(
                    "Frontend Settings Page Test",
                    False,
                    f"Settings page failed to load: {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Frontend Settings Page Test",
                False,
                f"Settings page test error: {str(e)}",
                {"error": str(e)}
            )
            return False
    
    def run_all_tests(self):
        """Run all backend tests for Settings functionality"""
        print("🧪 Starting Enhanced Settings Page Backend Tests")
        print("=" * 60)
        
        # Test 1: Supabase Connection
        supabase_connected = self.test_supabase_connection()
        
        # Test 2: Database Schema
        schema_exists = self.test_database_schema()
        
        # Test 3: Frontend Settings Page
        self.test_frontend_settings_page()
        
        # Only run database-dependent tests if schema exists
        if supabase_connected and schema_exists:
            # Test 4: User Authentication
            auth_success = self.test_user_authentication()
            
            if auth_success:
                # Test 5: Password Change Functionality
                self.test_password_change_functionality()
                
                # Test 6: User Profile Updates
                self.test_user_profile_updates()
                
                # Test 7: User Settings Persistence
                self.test_user_settings_persistence()
                
                # Test 8: Device Management
                self.test_device_management()
        else:
            self.log_result(
                "Database-dependent Tests",
                False,
                "Skipped due to missing database schema or connection issues",
                {"supabase_connected": supabase_connected, "schema_exists": schema_exists}
            )
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("🔍 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        print("\n🎯 CRITICAL FINDINGS:")
        
        # Check for critical issues
        critical_issues = []
        for result in self.test_results:
            if not result["success"] and any(keyword in result["test"].lower() for keyword in ["connection", "schema", "authentication"]):
                critical_issues.append(result["test"])
        
        if critical_issues:
            print("❌ Critical Issues Found:")
            for issue in critical_issues:
                print(f"   - {issue}")
        else:
            print("✅ No critical issues found")
        
        # Save results to file
        with open("/app/settings_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/settings_test_results.json")

if __name__ == "__main__":
    tester = SettingsBackendTester()
    tester.run_all_tests()