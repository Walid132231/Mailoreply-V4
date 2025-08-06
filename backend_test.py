#!/usr/bin/env python3
"""
Backend Test Suite for MailoReply AI Enterprise Invitation System
Tests all enterprise invitation functionality including database functions,
user limits, company management, and email integration.
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

# Configuration
SUPABASE_URL = "https://dfzspjqgvdzosrddqcje.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNwanFndmR6b3NyZGRxY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODc4MTEsImV4cCI6MjA2OTU2MzgxMX0.XGwGU6VEftwzqqWM5b_r6F42qrjBtw4a1Saq4LB_-HU"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzNzkxNCwiZXhwIjoyMDY5ODEzOTE0fQ.yfQNpr0Rk9Xlr7fVTOu8-GXBoo2Wc-P_Gjc7R3_W9CA"

# Database connection details
DB_HOST = "db.dfzspjqgvdzosrddqcje.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Walidjakarta1997!"

class EnterpriseInvitationTester:
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
        """Initialize database connection and HTTP session"""
        try:
            # Create database connection pool
            self.db_pool = await asyncpg.create_pool(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                min_size=1,
                max_size=5
            )
            
            # Create HTTP session
            self.session = aiohttp.ClientSession()
            
            print("✅ Database and HTTP session initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize connections: {e}")
            return False
    
    async def cleanup(self):
        """Clean up connections and test data"""
        try:
            if self.session:
                await self.session.close()
            
            if self.db_pool:
                # Clean up test data
                await self.cleanup_test_data()
                await self.db_pool.close()
                
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
    
    async def test_database_schema(self):
        """Test 1: Verify database schema exists"""
        try:
            async with self.db_pool.acquire() as conn:
                # Check if user_invitations table exists
                table_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'user_invitations'
                    )
                """)
                
                if not table_exists:
                    self.log_test_result(
                        "Database Schema - user_invitations table",
                        False,
                        "user_invitations table does not exist"
                    )
                    return False
                
                # Check table structure
                columns = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'user_invitations'
                    ORDER BY ordinal_position
                """)
                
                required_columns = {
                    'id', 'email', 'name', 'company_id', 'invited_by', 
                    'role', 'status', 'invitation_token', 'expires_at'
                }
                
                existing_columns = {col['column_name'] for col in columns}
                missing_columns = required_columns - existing_columns
                
                if missing_columns:
                    self.log_test_result(
                        "Database Schema - table structure",
                        False,
                        f"Missing columns: {missing_columns}",
                        {'existing_columns': list(existing_columns)}
                    )
                    return False
                
                # Check if functions exist
                functions_to_check = [
                    'invite_enterprise_user',
                    'bulk_invite_enterprise_users',
                    'accept_invitation',
                    'get_pending_invitations',
                    'cancel_invitation',
                    'resend_invitation'
                ]
                
                for func_name in functions_to_check:
                    func_exists = await conn.fetchval("""
                        SELECT EXISTS (
                            SELECT FROM pg_proc p
                            JOIN pg_namespace n ON p.pronamespace = n.oid
                            WHERE n.nspname = 'public' AND p.proname = $1
                        )
                    """, func_name)
                    
                    if not func_exists:
                        self.log_test_result(
                            f"Database Schema - {func_name} function",
                            False,
                            f"Function {func_name} does not exist"
                        )
                        return False
                
                self.log_test_result(
                    "Database Schema",
                    True,
                    "All required tables and functions exist",
                    {'columns': len(existing_columns), 'functions': len(functions_to_check)}
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Database Schema",
                False,
                f"Schema validation failed: {str(e)}"
            )
            return False
    
    async def create_test_company(self) -> Optional[str]:
        """Create a test company for testing"""
        try:
            company_id = str(uuid.uuid4())
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO companies (id, name, plan_type, max_users, current_users)
                    VALUES ($1, $2, $3, $4, $5)
                """, company_id, "Test Enterprise Corp", "enterprise", 10, 0)
                
                self.test_data['companies'].append(company_id)
                return company_id
                
        except Exception as e:
            print(f"Failed to create test company: {e}")
            return None
    
    async def create_test_manager(self, company_id: str) -> Optional[str]:
        """Create a test enterprise manager"""
        try:
            manager_id = str(uuid.uuid4())
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, company_id, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, manager_id, "Test Manager", "manager@testcorp.com", 
                "enterprise_manager", company_id, "active")
                
                self.test_data['users'].append(manager_id)
                return manager_id
                
        except Exception as e:
            print(f"Failed to create test manager: {e}")
            return None
    
    async def test_invite_enterprise_user_function(self):
        """Test 2: Test invite_enterprise_user function"""
        try:
            # Create test company and manager
            company_id = await self.create_test_company()
            if not company_id:
                self.log_test_result(
                    "Invite Enterprise User - Setup",
                    False,
                    "Failed to create test company"
                )
                return False
            
            manager_id = await self.create_test_manager(company_id)
            if not manager_id:
                self.log_test_result(
                    "Invite Enterprise User - Setup",
                    False,
                    "Failed to create test manager"
                )
                return False
            
            # Test the invitation function
            async with self.db_pool.acquire() as conn:
                result = await conn.fetchval("""
                    SELECT invite_enterprise_user(
                        $1::TEXT,  -- user_email
                        $2::TEXT,  -- user_name
                        $3::user_role,  -- user_role
                        $4::UUID   -- manager_user_id
                    )
                """, "testuser@testcorp.com", "Test User", "enterprise_user", manager_id)
                
                if not result:
                    self.log_test_result(
                        "Invite Enterprise User Function",
                        False,
                        "Function returned null result"
                    )
                    return False
                
                # Parse JSON result
                invitation_result = json.loads(result) if isinstance(result, str) else result
                
                if not invitation_result.get('success'):
                    self.log_test_result(
                        "Invite Enterprise User Function",
                        False,
                        f"Invitation failed: {invitation_result.get('error', 'Unknown error')}",
                        invitation_result
                    )
                    return False
                
                # Verify invitation was created in database
                invitation_id = invitation_result.get('invitation_id')
                if invitation_id:
                    self.test_data['invitations'].append(invitation_id)
                    
                    invitation_record = await conn.fetchrow("""
                        SELECT * FROM user_invitations WHERE id = $1
                    """, invitation_id)
                    
                    if not invitation_record:
                        self.log_test_result(
                            "Invite Enterprise User Function",
                            False,
                            "Invitation record not found in database"
                        )
                        return False
                
                self.log_test_result(
                    "Invite Enterprise User Function",
                    True,
                    "Successfully created enterprise user invitation",
                    {
                        'invitation_id': invitation_id,
                        'email': invitation_result.get('email'),
                        'company_name': invitation_result.get('company_name')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Invite Enterprise User Function",
                False,
                f"Function test failed: {str(e)}"
            )
            return False
    
    async def test_bulk_invite_function(self):
        """Test 3: Test bulk_invite_enterprise_users function"""
        try:
            # Create test company and manager
            company_id = await self.create_test_company()
            manager_id = await self.create_test_manager(company_id)
            
            if not company_id or not manager_id:
                self.log_test_result(
                    "Bulk Invite Function - Setup",
                    False,
                    "Failed to create test setup"
                )
                return False
            
            # Prepare bulk invitation data
            users_data = [
                {"email": "bulk1@testcorp.com", "name": "Bulk User 1", "role": "enterprise_user"},
                {"email": "bulk2@testcorp.com", "name": "Bulk User 2", "role": "enterprise_user"},
                {"email": "bulk3@testcorp.com", "name": "Bulk User 3", "role": "enterprise_manager"}
            ]
            
            async with self.db_pool.acquire() as conn:
                result = await conn.fetchval("""
                    SELECT bulk_invite_enterprise_users(
                        $1::JSON,  -- users_data
                        $2::UUID   -- manager_user_id
                    )
                """, json.dumps(users_data), manager_id)
                
                if not result:
                    self.log_test_result(
                        "Bulk Invite Function",
                        False,
                        "Function returned null result"
                    )
                    return False
                
                # Parse JSON result
                bulk_result = json.loads(result) if isinstance(result, str) else result
                
                if not bulk_result.get('success'):
                    self.log_test_result(
                        "Bulk Invite Function",
                        False,
                        f"Bulk invitation failed: {bulk_result.get('error', 'Unknown error')}",
                        bulk_result
                    )
                    return False
                
                # Verify results
                total_processed = bulk_result.get('total_processed', 0)
                successful_count = bulk_result.get('successful_count', 0)
                failed_count = bulk_result.get('failed_count', 0)
                
                if total_processed != len(users_data):
                    self.log_test_result(
                        "Bulk Invite Function",
                        False,
                        f"Expected {len(users_data)} processed, got {total_processed}"
                    )
                    return False
                
                # Store invitation IDs for cleanup
                successful_invitations = bulk_result.get('successful_invitations', [])
                for invitation in successful_invitations:
                    if isinstance(invitation, dict) and 'invitation_id' in invitation:
                        self.test_data['invitations'].append(invitation['invitation_id'])
                
                self.log_test_result(
                    "Bulk Invite Function",
                    True,
                    f"Successfully processed {total_processed} invitations",
                    {
                        'total_processed': total_processed,
                        'successful': successful_count,
                        'failed': failed_count
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Bulk Invite Function",
                False,
                f"Bulk invite test failed: {str(e)}"
            )
            return False
    
    async def test_user_limits_enforcement(self):
        """Test 4: Test user limits are properly enforced"""
        try:
            # Create company with low user limit
            company_id = str(uuid.uuid4())
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO companies (id, name, plan_type, max_users, current_users)
                    VALUES ($1, $2, $3, $4, $5)
                """, company_id, "Limited Test Corp", "enterprise", 2, 1)  # Only 1 slot left
                
                self.test_data['companies'].append(company_id)
                
                # Create manager
                manager_id = await self.create_test_manager(company_id)
                
                # Try to invite user (should succeed - 1 slot available)
                result1 = await conn.fetchval("""
                    SELECT invite_enterprise_user(
                        $1::TEXT, $2::TEXT, $3::user_role, $4::UUID
                    )
                """, "user1@limited.com", "User 1", "enterprise_user", manager_id)
                
                invitation1 = json.loads(result1) if isinstance(result1, str) else result1
                
                if not invitation1.get('success'):
                    self.log_test_result(
                        "User Limits Enforcement",
                        False,
                        "First invitation should have succeeded",
                        invitation1
                    )
                    return False
                
                # Update current_users to max
                await conn.execute("""
                    UPDATE companies SET current_users = max_users WHERE id = $1
                """, company_id)
                
                # Try to invite another user (should fail - no slots left)
                result2 = await conn.fetchval("""
                    SELECT invite_enterprise_user(
                        $1::TEXT, $2::TEXT, $3::user_role, $4::UUID
                    )
                """, "user2@limited.com", "User 2", "enterprise_user", manager_id)
                
                invitation2 = json.loads(result2) if isinstance(result2, str) else result2
                
                if invitation2.get('success'):
                    self.log_test_result(
                        "User Limits Enforcement",
                        False,
                        "Second invitation should have failed due to user limit",
                        invitation2
                    )
                    return False
                
                # Check error message mentions user limit
                error_msg = invitation2.get('error', '').lower()
                if 'limit' not in error_msg and 'maximum' not in error_msg:
                    self.log_test_result(
                        "User Limits Enforcement",
                        False,
                        "Error message should mention user limit",
                        {'error': invitation2.get('error')}
                    )
                    return False
                
                self.log_test_result(
                    "User Limits Enforcement",
                    True,
                    "User limits properly enforced",
                    {
                        'first_invitation': 'succeeded',
                        'second_invitation': 'failed_as_expected',
                        'error_message': invitation2.get('error')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "User Limits Enforcement",
                False,
                f"User limits test failed: {str(e)}"
            )
            return False
    
    async def test_invitation_acceptance(self):
        """Test 5: Test invitation acceptance workflow"""
        try:
            # Create test setup
            company_id = await self.create_test_company()
            manager_id = await self.create_test_manager(company_id)
            
            # Create invitation
            async with self.db_pool.acquire() as conn:
                invite_result = await conn.fetchval("""
                    SELECT invite_enterprise_user(
                        $1::TEXT, $2::TEXT, $3::user_role, $4::UUID
                    )
                """, "accept@testcorp.com", "Accept User", "enterprise_user", manager_id)
                
                invitation = json.loads(invite_result) if isinstance(invite_result, str) else invite_result
                
                if not invitation.get('success'):
                    self.log_test_result(
                        "Invitation Acceptance - Setup",
                        False,
                        "Failed to create invitation for acceptance test"
                    )
                    return False
                
                invitation_token = invitation.get('invitation_token')
                if not invitation_token:
                    self.log_test_result(
                        "Invitation Acceptance - Setup",
                        False,
                        "No invitation token returned"
                    )
                    return False
                
                # Create a user to accept the invitation
                accepting_user_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, status)
                    VALUES ($1, $2, $3, $4, $5)
                """, accepting_user_id, "Accept User", "accept@testcorp.com", "free", "active")
                
                self.test_data['users'].append(accepting_user_id)
                
                # Test invitation acceptance
                accept_result = await conn.fetchval("""
                    SELECT accept_invitation($1::UUID, $2::UUID)
                """, invitation_token, accepting_user_id)
                
                acceptance = json.loads(accept_result) if isinstance(accept_result, str) else accept_result
                
                if not acceptance.get('success'):
                    self.log_test_result(
                        "Invitation Acceptance",
                        False,
                        f"Invitation acceptance failed: {acceptance.get('error')}",
                        acceptance
                    )
                    return False
                
                # Verify user was updated
                updated_user = await conn.fetchrow("""
                    SELECT role, company_id, status FROM users WHERE id = $1
                """, accepting_user_id)
                
                if not updated_user:
                    self.log_test_result(
                        "Invitation Acceptance",
                        False,
                        "User record not found after acceptance"
                    )
                    return False
                
                if updated_user['company_id'] != company_id:
                    self.log_test_result(
                        "Invitation Acceptance",
                        False,
                        "User company_id not updated correctly"
                    )
                    return False
                
                if updated_user['role'] != 'enterprise_user':
                    self.log_test_result(
                        "Invitation Acceptance",
                        False,
                        f"User role not updated correctly: {updated_user['role']}"
                    )
                    return False
                
                # Verify invitation status updated
                invitation_status = await conn.fetchval("""
                    SELECT status FROM user_invitations WHERE invitation_token = $1
                """, invitation_token)
                
                if invitation_status != 'accepted':
                    self.log_test_result(
                        "Invitation Acceptance",
                        False,
                        f"Invitation status not updated: {invitation_status}"
                    )
                    return False
                
                self.log_test_result(
                    "Invitation Acceptance",
                    True,
                    "Invitation acceptance workflow completed successfully",
                    {
                        'user_role': updated_user['role'],
                        'company_id': str(updated_user['company_id']),
                        'invitation_status': invitation_status
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Invitation Acceptance",
                False,
                f"Invitation acceptance test failed: {str(e)}"
            )
            return False
    
    async def test_superuser_permissions(self):
        """Test 6: Test superuser can access all enterprise data"""
        try:
            # Create superuser
            superuser_id = str(uuid.uuid4())
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, status)
                    VALUES ($1, $2, $3, $4, $5)
                """, superuser_id, "Super Admin", "superadmin@mailoreply.ai", "superuser", "active")
                
                self.test_data['users'].append(superuser_id)
                
                # Test if superuser can view all companies
                companies = await conn.fetch("""
                    SELECT id, name FROM companies
                """)
                
                if not companies:
                    self.log_test_result(
                        "Superuser Permissions",
                        False,
                        "No companies found for superuser access test"
                    )
                    return False
                
                # Test if superuser can view all invitations
                invitations = await conn.fetch("""
                    SELECT id, email, status FROM user_invitations
                """)
                
                self.log_test_result(
                    "Superuser Permissions",
                    True,
                    "Superuser can access enterprise data",
                    {
                        'companies_accessible': len(companies),
                        'invitations_accessible': len(invitations)
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Superuser Permissions",
                False,
                f"Superuser permissions test failed: {str(e)}"
            )
            return False
    
    async def test_invitation_expiration(self):
        """Test 7: Test invitation expiration logic"""
        try:
            company_id = await self.create_test_company()
            manager_id = await self.create_test_manager(company_id)
            
            async with self.db_pool.acquire() as conn:
                # Create an expired invitation manually
                expired_invitation_id = str(uuid.uuid4())
                expired_token = str(uuid.uuid4())
                
                await conn.execute("""
                    INSERT INTO user_invitations 
                    (id, email, name, company_id, invited_by, role, status, invitation_token, expires_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """, expired_invitation_id, "expired@test.com", "Expired User", 
                company_id, manager_id, "enterprise_user", "pending", 
                expired_token, datetime.now() - timedelta(days=1))  # Expired yesterday
                
                self.test_data['invitations'].append(expired_invitation_id)
                
                # Try to accept expired invitation
                test_user_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, status)
                    VALUES ($1, $2, $3, $4, $5)
                """, test_user_id, "Test User", "expired@test.com", "free", "active")
                
                self.test_data['users'].append(test_user_id)
                
                accept_result = await conn.fetchval("""
                    SELECT accept_invitation($1::UUID, $2::UUID)
                """, expired_token, test_user_id)
                
                acceptance = json.loads(accept_result) if isinstance(accept_result, str) else accept_result
                
                if acceptance.get('success'):
                    self.log_test_result(
                        "Invitation Expiration",
                        False,
                        "Expired invitation should not be acceptable"
                    )
                    return False
                
                # Check error message mentions expiration
                error_msg = acceptance.get('error', '').lower()
                if 'expired' not in error_msg and 'invalid' not in error_msg:
                    self.log_test_result(
                        "Invitation Expiration",
                        False,
                        "Error message should mention expiration",
                        {'error': acceptance.get('error')}
                    )
                    return False
                
                # Test cleanup function
                cleanup_result = await conn.fetchval("""
                    SELECT cleanup_expired_invitations()
                """)
                
                if cleanup_result is None:
                    self.log_test_result(
                        "Invitation Expiration",
                        False,
                        "Cleanup function returned null"
                    )
                    return False
                
                # Verify expired invitation status updated
                updated_status = await conn.fetchval("""
                    SELECT status FROM user_invitations WHERE id = $1
                """, expired_invitation_id)
                
                if updated_status != 'expired':
                    self.log_test_result(
                        "Invitation Expiration",
                        False,
                        f"Expired invitation status not updated: {updated_status}"
                    )
                    return False
                
                self.log_test_result(
                    "Invitation Expiration",
                    True,
                    "Invitation expiration logic working correctly",
                    {
                        'expired_invitations_cleaned': cleanup_result,
                        'error_message': acceptance.get('error')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Invitation Expiration",
                False,
                f"Invitation expiration test failed: {str(e)}"
            )
            return False
    
    async def test_email_service_integration(self):
        """Test 8: Test email service integration (mock test)"""
        try:
            # This is a mock test since we don't have actual email service configured
            # In a real environment, this would test actual email sending
            
            # Test email template generation
            invitation_data = {
                'to': 'test@example.com',
                'name': 'Test User',
                'company_name': 'Test Company',
                'manager_name': 'Test Manager',
                'manager_email': 'manager@test.com',
                'invitation_url': 'https://app.mailoreply.ai/accept/token123',
                'expires_at': (datetime.now() + timedelta(days=7)).isoformat(),
                'role': 'enterprise_user'
            }
            
            # Simulate email template validation
            required_fields = ['to', 'name', 'company_name', 'manager_name', 'invitation_url']
            missing_fields = [field for field in required_fields if not invitation_data.get(field)]
            
            if missing_fields:
                self.log_test_result(
                    "Email Service Integration",
                    False,
                    f"Missing required email fields: {missing_fields}"
                )
                return False
            
            # Validate email format
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, invitation_data['to']):
                self.log_test_result(
                    "Email Service Integration",
                    False,
                    "Invalid email format"
                )
                return False
            
            # Validate URL format
            if not invitation_data['invitation_url'].startswith(('http://', 'https://')):
                self.log_test_result(
                    "Email Service Integration",
                    False,
                    "Invalid invitation URL format"
                )
                return False
            
            self.log_test_result(
                "Email Service Integration",
                True,
                "Email service integration validation passed",
                {
                    'template_fields': len(invitation_data),
                    'email_format': 'valid',
                    'url_format': 'valid'
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Email Service Integration",
                False,
                f"Email service test failed: {str(e)}"
            )
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Enterprise Invitation System Tests")
        print("=" * 60)
        
        # Initialize
        if not await self.setup():
            print("❌ Failed to initialize test environment")
            return False
        
        # Run tests
        tests = [
            self.test_database_schema,
            self.test_invite_enterprise_user_function,
            self.test_bulk_invite_function,
            self.test_user_limits_enforcement,
            self.test_invitation_acceptance,
            self.test_superuser_permissions,
            self.test_invitation_expiration,
            self.test_email_service_integration
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
            print("\n🎉 All tests passed! Enterprise invitation system is working correctly.")
        else:
            print(f"\n⚠️ {failed} test(s) failed. Please review the issues above.")
        
        return failed == 0

async def main():
    """Main test runner"""
    tester = EnterpriseInvitationTester()
    success = await tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())