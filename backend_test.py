#!/usr/bin/env python3
"""
Backend Test Suite for MailoReply AI Enterprise Creation Functionality
Tests the fixed enterprise creation functionality after schema corrections.
"""

import os
import json
import uuid
import asyncio
import aiohttp
import asyncpg
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys

# Configuration from .env file
SUPABASE_URL = "https://wacuqgyyctatwnbemkyx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzc5MTQsImV4cCI6MjA2OTgxMzkxNH0.Re8cuKLAtm7cy-AshX7F5-Gj0MC8VEu1OBigI6wCDk8"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzNzkxNCwiZXhwIjoyMDY5ODEzOTE0fQ.yfQNpr0Rk9Xlr7fVTOu8-GXBoo2Wc-P_Gjc7R3_W9CA"

# Database connection details
DB_HOST = "db.wacuqgyyctatwnbemkyx.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Walidjakarta1997!"

# Supabase API endpoints
SUPABASE_API_URL = f"{SUPABASE_URL}/rest/v1"

class EnterpriseCreationTester:
    def __init__(self):
        self.db_pool = None
        self.session = None
        self.test_results = []
        self.test_data = {
            'companies': [],
            'users': [],
            'invitations': []
        }
        
    async def setup(self):
        """Initialize HTTP session for API testing"""
        try:
            # Create HTTP session
            self.session = aiohttp.ClientSession()
            
            print("✅ HTTP session initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize HTTP session: {e}")
            return False
    
    async def cleanup(self):
        """Clean up connections and test data"""
        try:
            if self.session:
                # Clean up test data via API
                await self.cleanup_test_data()
                await self.session.close()
                
            print("✅ Cleanup completed successfully")
            
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
    
    async def cleanup_test_data(self):
        """Remove test data created during testing"""
        try:
            async with self.db_pool.acquire() as conn:
                # Delete test invitations
                for invitation_id in self.test_data['invitations']:
                    await conn.execute(
                        "DELETE FROM user_invitations WHERE id = $1",
                        invitation_id
                    )
                
                # Delete test users
                for user_id in self.test_data['users']:
                    await conn.execute(
                        "DELETE FROM users WHERE id = $1",
                        user_id
                    )
                
                # Delete test companies
                for company_id in self.test_data['companies']:
                    await conn.execute(
                        "DELETE FROM companies WHERE id = $1",
                        company_id
                    )
                        
            print("✅ Test data cleaned up")
            
        except Exception as e:
            print(f"⚠️ Test data cleanup warning: {e}")
    
    def log_test_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        
        if details and not success:
            print(f"   Details: {details}")

    async def test_database_schema_validation(self):
        """Test 1: Verify database schema matches expected structure"""
        try:
            async with self.db_pool.acquire() as conn:
                # Check companies table structure
                companies_columns = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'companies'
                    ORDER BY ordinal_position
                """)
                
                companies_column_names = {col['column_name'] for col in companies_columns}
                
                # Verify corrected schema - should have 'plan' not 'plan_type'
                if 'plan' not in companies_column_names:
                    self.log_test_result(
                        "Database Schema - Companies Table",
                        False,
                        "Missing 'plan' column in companies table"
                    )
                    return False
                
                # Verify monthly_payment column is NOT present (was removed)
                if 'monthly_payment' in companies_column_names:
                    self.log_test_result(
                        "Database Schema - Companies Table",
                        False,
                        "Found 'monthly_payment' column - should have been removed"
                    )
                    return False
                
                # Check required columns exist
                required_columns = {
                    'id', 'name', 'plan', 'max_users', 'current_users', 
                    'domain', 'status', 'created_at', 'updated_at'
                }
                
                missing_columns = required_columns - companies_column_names
                if missing_columns:
                    self.log_test_result(
                        "Database Schema - Companies Table",
                        False,
                        f"Missing required columns: {missing_columns}"
                    )
                    return False
                
                # Check plan enum values
                plan_enum_values = await conn.fetchval("""
                    SELECT array_agg(enumlabel::text)
                    FROM pg_enum e
                    JOIN pg_type t ON e.enumtypid = t.oid
                    WHERE t.typname = 'plan_type'
                """)
                
                if 'enterprise' not in plan_enum_values:
                    self.log_test_result(
                        "Database Schema - Plan Enum",
                        False,
                        f"'enterprise' not found in plan enum values: {plan_enum_values}"
                    )
                    return False
                
                self.log_test_result(
                    "Database Schema Validation",
                    True,
                    "Schema correctly updated - 'plan' column exists, 'monthly_payment' removed",
                    {
                        'companies_columns': list(companies_column_names),
                        'plan_enum_values': plan_enum_values
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Database Schema Validation",
                False,
                f"Schema validation failed: {str(e)}"
            )
            return False

    async def test_company_creation_with_service_role(self):
        """Test 2: Test company creation using service role client (bypasses RLS)"""
        try:
            # Test data matching the fixed schema
            test_company_data = {
                'name': 'Test Enterprise Corp',
                'domain': 'testcorp.com',
                'plan': 'enterprise',  # Using 'plan' not 'plan_type'
                'max_users': 50,
                'current_users': 0,
                'status': 'active'
            }
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            # Create company via Supabase REST API using service role
            async with self.session.post(
                f"{SUPABASE_API_URL}/companies",
                json=test_company_data,
                headers=headers
            ) as response:
                
                if response.status != 201:
                    error_text = await response.text()
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        f"Failed to create company. Status: {response.status}",
                        {'error': error_text, 'test_data': test_company_data}
                    )
                    return False
                
                company_data = await response.json()
                
                if not company_data or not isinstance(company_data, list) or len(company_data) == 0:
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        "No company data returned from creation"
                    )
                    return False
                
                created_company = company_data[0]
                company_id = created_company.get('id')
                
                if not company_id:
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        "No company ID returned"
                    )
                    return False
                
                # Store for cleanup
                self.test_data['companies'].append(company_id)
                
                # Verify the company was created with correct data
                if created_company.get('plan') != 'enterprise':
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        f"Plan field incorrect. Expected: 'enterprise', Got: {created_company.get('plan')}"
                    )
                    return False
                
                # Verify no monthly_payment field is present
                if 'monthly_payment' in created_company:
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        "monthly_payment field should not be present in response"
                    )
                    return False
                
                self.log_test_result(
                    "Company Creation with Service Role",
                    True,
                    "Company created successfully with corrected schema",
                    {
                        'company_id': company_id,
                        'name': created_company.get('name'),
                        'plan': created_company.get('plan'),
                        'max_users': created_company.get('max_users')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Company Creation with Service Role",
                False,
                f"Company creation test failed: {str(e)}"
            )
            return False

    async def test_enterprise_manager_creation(self):
        """Test 3: Test enterprise manager user creation"""
        try:
            # First create a company
            company_id = await self.create_test_company()
            if not company_id:
                self.log_test_result(
                    "Enterprise Manager Creation - Setup",
                    False,
                    "Failed to create test company"
                )
                return False
            
            # Test manager user data
            manager_data = {
                'name': 'Enterprise Manager',
                'email': 'manager@testcorp.com',
                'role': 'enterprise_manager',
                'company_id': company_id,
                'daily_limit': -1,
                'monthly_limit': -1,
                'device_limit': -1,
                'status': 'active'
            }
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            # Create manager user via Supabase REST API
            async with self.session.post(
                f"{SUPABASE_API_URL}/users",
                json=manager_data,
                headers=headers
            ) as response:
                
                if response.status != 201:
                    error_text = await response.text()
                    self.log_test_result(
                        "Enterprise Manager Creation",
                        False,
                        f"Failed to create manager. Status: {response.status}",
                        {'error': error_text}
                    )
                    return False
                
                user_data = await response.json()
                
                if not user_data or not isinstance(user_data, list) or len(user_data) == 0:
                    self.log_test_result(
                        "Enterprise Manager Creation",
                        False,
                        "No user data returned from creation"
                    )
                    return False
                
                created_user = user_data[0]
                user_id = created_user.get('id')
                
                if not user_id:
                    self.log_test_result(
                        "Enterprise Manager Creation",
                        False,
                        "No user ID returned"
                    )
                    return False
                
                # Store for cleanup
                self.test_data['users'].append(user_id)
                
                # Verify user was created with correct role and company
                if created_user.get('role') != 'enterprise_manager':
                    self.log_test_result(
                        "Enterprise Manager Creation",
                        False,
                        f"Role incorrect. Expected: 'enterprise_manager', Got: {created_user.get('role')}"
                    )
                    return False
                
                if created_user.get('company_id') != company_id:
                    self.log_test_result(
                        "Enterprise Manager Creation",
                        False,
                        f"Company ID incorrect. Expected: {company_id}, Got: {created_user.get('company_id')}"
                    )
                    return False
                
                self.log_test_result(
                    "Enterprise Manager Creation",
                    True,
                    "Enterprise manager created successfully",
                    {
                        'user_id': user_id,
                        'email': created_user.get('email'),
                        'role': created_user.get('role'),
                        'company_id': created_user.get('company_id')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Enterprise Manager Creation",
                False,
                f"Manager creation test failed: {str(e)}"
            )
            return False

    async def test_data_retrieval_without_monthly_payment(self):
        """Test 4: Test data retrieval works without monthly_payment field"""
        try:
            # Create test company
            company_id = await self.create_test_company()
            if not company_id:
                self.log_test_result(
                    "Data Retrieval Test - Setup",
                    False,
                    "Failed to create test company"
                )
                return False
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json'
            }
            
            # Fetch companies data (simulating fetchEnterprises function)
            async with self.session.get(
                f"{SUPABASE_API_URL}/companies?select=*,users(id,name,email,role)",
                headers=headers
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    self.log_test_result(
                        "Data Retrieval without monthly_payment",
                        False,
                        f"Failed to fetch companies. Status: {response.status}",
                        {'error': error_text}
                    )
                    return False
                
                companies_data = await response.json()
                
                if not companies_data:
                    self.log_test_result(
                        "Data Retrieval without monthly_payment",
                        False,
                        "No companies data returned"
                    )
                    return False
                
                # Find our test company
                test_company = None
                for company in companies_data:
                    if company.get('id') == company_id:
                        test_company = company
                        break
                
                if not test_company:
                    self.log_test_result(
                        "Data Retrieval without monthly_payment",
                        False,
                        "Test company not found in results"
                    )
                    return False
                
                # Verify monthly_payment field is not present
                if 'monthly_payment' in test_company:
                    self.log_test_result(
                        "Data Retrieval without monthly_payment",
                        False,
                        "monthly_payment field should not be present in response"
                    )
                    return False
                
                # Verify required fields are present
                required_fields = ['id', 'name', 'plan', 'max_users', 'current_users']
                missing_fields = [field for field in required_fields if field not in test_company]
                
                if missing_fields:
                    self.log_test_result(
                        "Data Retrieval without monthly_payment",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
                    return False
                
                # Test data transformation (simulating EnterpriseManagement.tsx logic)
                transformed_data = {
                    'id': test_company.get('id'),
                    'name': test_company.get('name'),
                    'domain': test_company.get('domain', ''),
                    'users': test_company.get('current_users', 0),
                    'maxUsers': test_company.get('max_users', 0),
                    'monthlyPayment': 999.99,  # Fixed value as in the code
                    'status': 'active' if test_company.get('status') == 'active' else 'suspended'
                }
                
                self.log_test_result(
                    "Data Retrieval without monthly_payment",
                    True,
                    "Data retrieval and transformation successful",
                    {
                        'company_fields': list(test_company.keys()),
                        'transformed_data': transformed_data
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Data Retrieval without monthly_payment",
                False,
                f"Data retrieval test failed: {str(e)}"
            )
            return False

    async def test_complete_enterprise_creation_workflow(self):
        """Test 5: Test complete enterprise creation workflow"""
        try:
            # Simulate the complete workflow from EnterpriseManagement.tsx
            enterprise_data = {
                'name': 'Complete Test Corp',
                'domain': 'completetest.com',
                'managerName': 'Complete Manager',
                'managerEmail': 'complete@testcorp.com',
                'maxUsers': 25
            }
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            # Step 1: Create company
            company_payload = {
                'name': enterprise_data['name'],
                'domain': enterprise_data['domain'],
                'plan': 'enterprise',
                'max_users': enterprise_data['maxUsers'],
                'current_users': 0,
                'status': 'active'
            }
            
            async with self.session.post(
                f"{SUPABASE_API_URL}/companies",
                json=company_payload,
                headers=headers
            ) as response:
                
                if response.status != 201:
                    error_text = await response.text()
                    self.log_test_result(
                        "Complete Enterprise Creation - Company",
                        False,
                        f"Company creation failed. Status: {response.status}",
                        {'error': error_text}
                    )
                    return False
                
                company_result = await response.json()
                company = company_result[0]
                company_id = company['id']
                self.test_data['companies'].append(company_id)
            
            # Step 2: Create manager user
            user_payload = {
                'name': enterprise_data['managerName'],
                'email': enterprise_data['managerEmail'],
                'role': 'enterprise_manager',
                'company_id': company_id,
                'daily_limit': -1,
                'monthly_limit': -1,
                'device_limit': -1,
                'status': 'active'
            }
            
            async with self.session.post(
                f"{SUPABASE_API_URL}/users",
                json=user_payload,
                headers=headers
            ) as response:
                
                if response.status != 201:
                    error_text = await response.text()
                    self.log_test_result(
                        "Complete Enterprise Creation - Manager",
                        False,
                        f"Manager creation failed. Status: {response.status}",
                        {'error': error_text}
                    )
                    return False
                
                user_result = await response.json()
                user = user_result[0]
                user_id = user['id']
                self.test_data['users'].append(user_id)
            
            # Step 3: Verify the complete setup
            # Fetch the created company with users
            async with self.session.get(
                f"{SUPABASE_API_URL}/companies?id=eq.{company_id}&select=*,users(id,name,email,role)",
                headers=headers
            ) as response:
                
                if response.status != 200:
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        "Failed to verify created enterprise"
                    )
                    return False
                
                verification_data = await response.json()
                
                if not verification_data or len(verification_data) == 0:
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        "No enterprise data found for verification"
                    )
                    return False
                
                enterprise = verification_data[0]
                
                # Verify company data
                if enterprise.get('name') != enterprise_data['name']:
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        f"Company name mismatch. Expected: {enterprise_data['name']}, Got: {enterprise.get('name')}"
                    )
                    return False
                
                if enterprise.get('plan') != 'enterprise':
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        f"Plan mismatch. Expected: 'enterprise', Got: {enterprise.get('plan')}"
                    )
                    return False
                
                # Verify manager user
                users = enterprise.get('users', [])
                manager = None
                for user in users:
                    if user.get('role') == 'enterprise_manager':
                        manager = user
                        break
                
                if not manager:
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        "No enterprise manager found"
                    )
                    return False
                
                if manager.get('email') != enterprise_data['managerEmail']:
                    self.log_test_result(
                        "Complete Enterprise Creation - Verification",
                        False,
                        f"Manager email mismatch. Expected: {enterprise_data['managerEmail']}, Got: {manager.get('email')}"
                    )
                    return False
                
                self.log_test_result(
                    "Complete Enterprise Creation Workflow",
                    True,
                    "Complete enterprise creation workflow successful",
                    {
                        'company_id': company_id,
                        'company_name': enterprise.get('name'),
                        'manager_id': manager.get('id'),
                        'manager_email': manager.get('email'),
                        'plan': enterprise.get('plan'),
                        'max_users': enterprise.get('max_users')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Complete Enterprise Creation Workflow",
                False,
                f"Complete workflow test failed: {str(e)}"
            )
            return False

    async def test_plan_enum_validation(self):
        """Test 6: Test plan enum accepts 'enterprise' value"""
        try:
            # Test creating company with 'enterprise' plan
            test_data = {
                'name': 'Plan Test Corp',
                'plan': 'enterprise',
                'max_users': 10,
                'current_users': 0,
                'status': 'active'
            }
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            async with self.session.post(
                f"{SUPABASE_API_URL}/companies",
                json=test_data,
                headers=headers
            ) as response:
                
                if response.status != 201:
                    error_text = await response.text()
                    self.log_test_result(
                        "Plan Enum Validation",
                        False,
                        f"Failed to create company with 'enterprise' plan. Status: {response.status}",
                        {'error': error_text}
                    )
                    return False
                
                company_data = await response.json()
                created_company = company_data[0]
                company_id = created_company.get('id')
                
                if company_id:
                    self.test_data['companies'].append(company_id)
                
                if created_company.get('plan') != 'enterprise':
                    self.log_test_result(
                        "Plan Enum Validation",
                        False,
                        f"Plan value not saved correctly. Expected: 'enterprise', Got: {created_company.get('plan')}"
                    )
                    return False
                
                self.log_test_result(
                    "Plan Enum Validation",
                    True,
                    "Plan enum correctly accepts 'enterprise' value",
                    {'company_id': company_id, 'plan': created_company.get('plan')}
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Plan Enum Validation",
                False,
                f"Plan enum validation failed: {str(e)}"
            )
            return False

    async def create_test_company(self) -> Optional[str]:
        """Helper method to create a test company"""
        try:
            company_data = {
                'name': f'Test Company {uuid.uuid4().hex[:8]}',
                'plan': 'enterprise',
                'max_users': 50,
                'current_users': 0,
                'status': 'active'
            }
            
            headers = {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            
            async with self.session.post(
                f"{SUPABASE_API_URL}/companies",
                json=company_data,
                headers=headers
            ) as response:
                
                if response.status == 201:
                    result = await response.json()
                    company_id = result[0]['id']
                    self.test_data['companies'].append(company_id)
                    return company_id
                
                return None
                
        except Exception as e:
            print(f"Failed to create test company: {e}")
            return None

    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Enterprise Creation Functionality Tests")
        print("=" * 60)
        
        # Initialize
        if not await self.setup():
            print("❌ Failed to initialize test environment")
            return False
        
        # Run tests
        tests = [
            self.test_database_schema_validation,
            self.test_company_creation_with_service_role,
            self.test_enterprise_manager_creation,
            self.test_data_retrieval_without_monthly_payment,
            self.test_complete_enterprise_creation_workflow,
            self.test_plan_enum_validation
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                result = await test()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
                failed += 1
            
            print()  # Add spacing between tests
        
        # Cleanup
        await self.cleanup()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All tests passed! Enterprise creation functionality is working correctly.")
        else:
            print(f"\n⚠️ {failed} test(s) failed. Please review the issues above.")
        
        return failed == 0

async def main():
    """Main test runner"""
    tester = EnterpriseCreationTester()
    success = await tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())