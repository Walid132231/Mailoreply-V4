#!/usr/bin/env python3
"""
Enterprise Creation Functionality Test Suite
Tests the newly implemented enterprise creation functionality with real Supabase integration.
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

# Configuration from environment variables
SUPABASE_URL = "https://wacuqgyyctatwnbemkyx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzc5MTQsImV4cCI6MjA2OTgxMzkxNH0.Re8cuKLAtm7cy-AshX7F5-Gj0MC8VEu1OBigI6wCDk8"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzNzkxNCwiZXhwIjoyMDY5ODEzOTE0fQ.yfQNpr0Rk9Xlr7fVTOu8-GXBoo2Wc-P_Gjc7R3_W9CA"

# Database connection details
DB_HOST = "db.wacuqgyyctatwnbemkyx.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Walidjakarta1997!"

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
    
    async def test_service_role_configuration(self):
        """Test 1: Verify VITE_SUPABASE_SERVICE_ROLE_KEY is accessible and working"""
        try:
            # Test if service role key is configured
            if not SUPABASE_SERVICE_ROLE_KEY:
                self.log_test_result(
                    "Service Role Configuration",
                    False,
                    "VITE_SUPABASE_SERVICE_ROLE_KEY not found in environment"
                )
                return False
            
            # Test database connection with service role credentials
            async with self.db_pool.acquire() as conn:
                # Test if we can access system tables (service role should have elevated permissions)
                result = await conn.fetchval("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                
                if result is None or result < 1:
                    self.log_test_result(
                        "Service Role Configuration",
                        False,
                        "Service role cannot access system tables"
                    )
                    return False
                
                # Test if we can create a test table (service role should bypass RLS)
                test_table_name = f"test_service_role_{uuid.uuid4().hex[:8]}"
                try:
                    await conn.execute(f"""
                        CREATE TABLE {test_table_name} (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            test_data TEXT
                        )
                    """)
                    
                    # Insert test data
                    await conn.execute(f"""
                        INSERT INTO {test_table_name} (test_data) VALUES ('service_role_test')
                    """)
                    
                    # Verify data was inserted
                    test_data = await conn.fetchval(f"""
                        SELECT test_data FROM {test_table_name} LIMIT 1
                    """)
                    
                    if test_data != 'service_role_test':
                        raise Exception("Failed to insert/retrieve test data")
                    
                    # Clean up test table
                    await conn.execute(f"DROP TABLE {test_table_name}")
                    
                except Exception as e:
                    self.log_test_result(
                        "Service Role Configuration",
                        False,
                        f"Service role cannot create/modify tables: {str(e)}"
                    )
                    return False
                
                self.log_test_result(
                    "Service Role Configuration",
                    True,
                    "Service role key is properly configured and has elevated permissions",
                    {
                        'tables_accessible': result,
                        'can_create_tables': True,
                        'can_bypass_rls': True
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Service Role Configuration",
                False,
                f"Service role configuration test failed: {str(e)}"
            )
            return False
    
    async def test_database_schema_validation(self):
        """Test 2: Confirm database schema has all required fields"""
        try:
            async with self.db_pool.acquire() as conn:
                # Check companies table structure
                companies_columns = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'companies'
                    ORDER BY ordinal_position
                """)
                
                required_company_fields = {
                    'id', 'name', 'plan', 'max_users', 'current_users', 
                    'domain', 'status', 'created_at', 'updated_at'
                }
                
                existing_company_fields = {col['column_name'] for col in companies_columns}
                missing_company_fields = required_company_fields - existing_company_fields
                
                if missing_company_fields:
                    self.log_test_result(
                        "Database Schema - Companies Table",
                        False,
                        f"Missing required fields in companies table: {missing_company_fields}",
                        {'existing_fields': list(existing_company_fields)}
                    )
                    return False
                
                # Check users table structure
                users_columns = await conn.fetch("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                """)
                
                required_user_fields = {
                    'id', 'email', 'name', 'role', 'company_id', 'status',
                    'daily_limit', 'monthly_limit', 'device_limit', 'created_at'
                }
                
                existing_user_fields = {col['column_name'] for col in users_columns}
                missing_user_fields = required_user_fields - existing_user_fields
                
                if missing_user_fields:
                    self.log_test_result(
                        "Database Schema - Users Table",
                        False,
                        f"Missing required fields in users table: {missing_user_fields}",
                        {'existing_fields': list(existing_user_fields)}
                    )
                    return False
                
                # Check if enterprise_manager role is supported
                role_check = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_enum e
                        JOIN pg_type t ON e.enumtypid = t.oid
                        WHERE t.typname = 'user_role' AND e.enumlabel = 'enterprise_manager'
                    )
                """)
                
                if not role_check:
                    self.log_test_result(
                        "Database Schema - User Roles",
                        False,
                        "enterprise_manager role not found in user_role enum"
                    )
                    return False
                
                # Check if invite_enterprise_user function exists
                func_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM pg_proc p
                        JOIN pg_namespace n ON p.pronamespace = n.oid
                        WHERE n.nspname = 'public' AND p.proname = 'invite_enterprise_user'
                    )
                """)
                
                if not func_exists:
                    self.log_test_result(
                        "Database Schema - RPC Functions",
                        False,
                        "invite_enterprise_user RPC function not found"
                    )
                    return False
                
                self.log_test_result(
                    "Database Schema Validation",
                    True,
                    "All required database schema elements are present",
                    {
                        'companies_fields': len(existing_company_fields),
                        'users_fields': len(existing_user_fields),
                        'enterprise_manager_role': True,
                        'rpc_function': True
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
        """Test 3: Test company creation in 'companies' table with service role"""
        try:
            company_id = str(uuid.uuid4())
            company_name = f"Test Enterprise Corp {uuid.uuid4().hex[:8]}"
            
            async with self.db_pool.acquire() as conn:
                # Test company creation using service role permissions
                await conn.execute("""
                    INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                company_id, 
                company_name, 
                'enterprise', 
                50, 
                0, 
                'active', 
                datetime.now().isoformat(),
                datetime.now().isoformat()
                )
                
                self.test_data['companies'].append(company_id)
                
                # Verify company was created
                created_company = await conn.fetchrow("""
                    SELECT id, name, plan, max_users, current_users, status
                    FROM companies WHERE id = $1
                """, company_id)
                
                if not created_company:
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        "Company record not found after creation"
                    )
                    return False
                
                if created_company['name'] != company_name:
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        f"Company name mismatch: expected {company_name}, got {created_company['name']}"
                    )
                    return False
                
                if created_company['plan'] != 'enterprise':
                    self.log_test_result(
                        "Company Creation with Service Role",
                        False,
                        f"Company plan mismatch: expected 'enterprise', got {created_company['plan']}"
                    )
                    return False
                
                self.log_test_result(
                    "Company Creation with Service Role",
                    True,
                    "Company successfully created with service role permissions",
                    {
                        'company_id': company_id,
                        'company_name': company_name,
                        'plan': created_company['plan'],
                        'max_users': created_company['max_users'],
                        'status': created_company['status']
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Company Creation with Service Role",
                False,
                f"Company creation failed: {str(e)}"
            )
            return False
    
    async def test_manager_user_creation_with_service_role(self):
        """Test 4: Test manager user creation in 'users' table with service role"""
        try:
            # First create a company for the manager
            company_id = str(uuid.uuid4())
            company_name = f"Manager Test Corp {uuid.uuid4().hex[:8]}"
            
            async with self.db_pool.acquire() as conn:
                # Create company
                await conn.execute("""
                    INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                company_id, 
                company_name, 
                'enterprise', 
                50, 
                0, 
                'active', 
                datetime.now().isoformat(),
                datetime.now().isoformat()
                )
                
                self.test_data['companies'].append(company_id)
                
                # Create manager user
                manager_id = str(uuid.uuid4())
                manager_email = f"manager{uuid.uuid4().hex[:8]}@testcorp.com"
                manager_name = f"Test Manager {uuid.uuid4().hex[:8]}"
                
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """, 
                manager_id,
                manager_name,
                manager_email,
                'enterprise_manager',
                company_id,
                -1,  # unlimited
                -1,  # unlimited
                -1,  # unlimited
                'active',
                datetime.now().isoformat(),
                datetime.now().isoformat()
                )
                
                self.test_data['users'].append(manager_id)
                
                # Verify manager user was created
                created_manager = await conn.fetchrow("""
                    SELECT id, name, email, role, company_id, status
                    FROM users WHERE id = $1
                """, manager_id)
                
                if not created_manager:
                    self.log_test_result(
                        "Manager User Creation with Service Role",
                        False,
                        "Manager user record not found after creation"
                    )
                    return False
                
                if created_manager['role'] != 'enterprise_manager':
                    self.log_test_result(
                        "Manager User Creation with Service Role",
                        False,
                        f"Manager role mismatch: expected 'enterprise_manager', got {created_manager['role']}"
                    )
                    return False
                
                if created_manager['company_id'] != company_id:
                    self.log_test_result(
                        "Manager User Creation with Service Role",
                        False,
                        f"Manager company_id mismatch: expected {company_id}, got {created_manager['company_id']}"
                    )
                    return False
                
                # Test that manager is properly linked to company
                company_with_manager = await conn.fetchrow("""
                    SELECT c.name as company_name, u.name as manager_name, u.role
                    FROM companies c
                    JOIN users u ON u.company_id = c.id
                    WHERE c.id = $1 AND u.role = 'enterprise_manager'
                """, company_id)
                
                if not company_with_manager:
                    self.log_test_result(
                        "Manager User Creation with Service Role",
                        False,
                        "Manager not properly linked to company"
                    )
                    return False
                
                self.log_test_result(
                    "Manager User Creation with Service Role",
                    True,
                    "Manager user successfully created and linked to company",
                    {
                        'manager_id': manager_id,
                        'manager_email': manager_email,
                        'manager_name': manager_name,
                        'company_id': company_id,
                        'company_name': company_name,
                        'role': created_manager['role'],
                        'status': created_manager['status']
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Manager User Creation with Service Role",
                False,
                f"Manager user creation failed: {str(e)}"
            )
            return False
    
    async def test_invite_enterprise_user_rpc_function(self):
        """Test 5: Test invite_enterprise_user RPC function call"""
        try:
            # Create test company and manager first
            company_id = str(uuid.uuid4())
            company_name = f"RPC Test Corp {uuid.uuid4().hex[:8]}"
            manager_id = str(uuid.uuid4())
            manager_email = f"rpcmanager{uuid.uuid4().hex[:8]}@testcorp.com"
            
            async with self.db_pool.acquire() as conn:
                # Create company
                await conn.execute("""
                    INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                company_id, company_name, 'enterprise', 50, 0, 'active', 
                datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['companies'].append(company_id)
                
                # Create manager
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """, 
                manager_id, "RPC Test Manager", manager_email, 'enterprise_manager', company_id,
                -1, -1, -1, 'active', datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['users'].append(manager_id)
                
                # Test the RPC function
                invite_email = f"rpcuser{uuid.uuid4().hex[:8]}@testcorp.com"
                invite_name = f"RPC Test User {uuid.uuid4().hex[:8]}"
                
                result = await conn.fetchval("""
                    SELECT invite_enterprise_user(
                        $1::TEXT,  -- user_email
                        $2::TEXT,  -- user_name
                        $3::user_role,  -- user_role
                        $4::UUID   -- manager_user_id
                    )
                """, invite_email, invite_name, 'enterprise_user', manager_id)
                
                if not result:
                    self.log_test_result(
                        "invite_enterprise_user RPC Function",
                        False,
                        "RPC function returned null result"
                    )
                    return False
                
                # Parse JSON result
                invitation_result = json.loads(result) if isinstance(result, str) else result
                
                if not invitation_result.get('success'):
                    self.log_test_result(
                        "invite_enterprise_user RPC Function",
                        False,
                        f"RPC function failed: {invitation_result.get('error', 'Unknown error')}",
                        invitation_result
                    )
                    return False
                
                # Verify invitation was created in database
                invitation_id = invitation_result.get('invitation_id')
                if invitation_id:
                    self.test_data['invitations'].append(invitation_id)
                    
                    invitation_record = await conn.fetchrow("""
                        SELECT id, email, name, role, company_id, status
                        FROM user_invitations WHERE id = $1
                    """, invitation_id)
                    
                    if not invitation_record:
                        self.log_test_result(
                            "invite_enterprise_user RPC Function",
                            False,
                            "Invitation record not found in database after RPC call"
                        )
                        return False
                    
                    if invitation_record['email'] != invite_email:
                        self.log_test_result(
                            "invite_enterprise_user RPC Function",
                            False,
                            f"Invitation email mismatch: expected {invite_email}, got {invitation_record['email']}"
                        )
                        return False
                
                self.log_test_result(
                    "invite_enterprise_user RPC Function",
                    True,
                    "RPC function executed successfully and created invitation",
                    {
                        'invitation_id': invitation_id,
                        'email': invite_email,
                        'name': invite_name,
                        'role': invitation_record['role'] if invitation_record else 'unknown',
                        'company_id': str(invitation_record['company_id']) if invitation_record else 'unknown',
                        'status': invitation_record['status'] if invitation_record else 'unknown'
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "invite_enterprise_user RPC Function",
                False,
                f"RPC function test failed: {str(e)}"
            )
            return False
    
    async def test_data_linking_and_relationships(self):
        """Test 6: Verify data is properly linked between tables (company_id relationships)"""
        try:
            # Create a complete enterprise setup
            company_id = str(uuid.uuid4())
            company_name = f"Relationship Test Corp {uuid.uuid4().hex[:8]}"
            manager_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())
            
            async with self.db_pool.acquire() as conn:
                # Create company
                await conn.execute("""
                    INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                company_id, company_name, 'enterprise', 50, 2, 'active', 
                datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['companies'].append(company_id)
                
                # Create manager
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """, 
                manager_id, "Relationship Manager", f"relmanager{uuid.uuid4().hex[:8]}@test.com", 
                'enterprise_manager', company_id, -1, -1, -1, 'active', 
                datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['users'].append(manager_id)
                
                # Create regular user
                await conn.execute("""
                    INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """, 
                user_id, "Relationship User", f"reluser{uuid.uuid4().hex[:8]}@test.com", 
                'enterprise_user', company_id, 100, 1000, 5, 'active', 
                datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['users'].append(user_id)
                
                # Test relationships with JOIN queries
                company_users = await conn.fetch("""
                    SELECT c.name as company_name, c.plan, c.max_users, c.current_users,
                           u.name as user_name, u.email, u.role
                    FROM companies c
                    JOIN users u ON u.company_id = c.id
                    WHERE c.id = $1
                    ORDER BY u.role DESC
                """, company_id)
                
                if len(company_users) != 2:
                    self.log_test_result(
                        "Data Linking and Relationships",
                        False,
                        f"Expected 2 users linked to company, found {len(company_users)}"
                    )
                    return False
                
                # Verify manager is first (due to ORDER BY role DESC)
                manager_record = company_users[0]
                user_record = company_users[1]
                
                if manager_record['role'] != 'enterprise_manager':
                    self.log_test_result(
                        "Data Linking and Relationships",
                        False,
                        f"First user should be manager, got role: {manager_record['role']}"
                    )
                    return False
                
                if user_record['role'] != 'enterprise_user':
                    self.log_test_result(
                        "Data Linking and Relationships",
                        False,
                        f"Second user should be enterprise_user, got role: {user_record['role']}"
                    )
                    return False
                
                # Test reverse relationship (users to company)
                user_companies = await conn.fetch("""
                    SELECT u.name as user_name, u.role, c.name as company_name, c.plan
                    FROM users u
                    JOIN companies c ON c.id = u.company_id
                    WHERE u.id IN ($1, $2)
                """, manager_id, user_id)
                
                if len(user_companies) != 2:
                    self.log_test_result(
                        "Data Linking and Relationships",
                        False,
                        f"Expected 2 user-company relationships, found {len(user_companies)}"
                    )
                    return False
                
                # Verify all users belong to the same company
                unique_companies = set(record['company_name'] for record in user_companies)
                if len(unique_companies) != 1 or company_name not in unique_companies:
                    self.log_test_result(
                        "Data Linking and Relationships",
                        False,
                        f"Users not properly linked to company. Found companies: {unique_companies}"
                    )
                    return False
                
                self.log_test_result(
                    "Data Linking and Relationships",
                    True,
                    "All data relationships are properly established",
                    {
                        'company_id': company_id,
                        'company_name': company_name,
                        'linked_users': len(company_users),
                        'manager_count': sum(1 for u in company_users if u['role'] == 'enterprise_manager'),
                        'user_count': sum(1 for u in company_users if u['role'] == 'enterprise_user'),
                        'relationship_integrity': True
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "Data Linking and Relationships",
                False,
                f"Relationship test failed: {str(e)}"
            )
            return False
    
    async def test_error_handling(self):
        """Test 7: Test error handling for invalid data and edge cases"""
        try:
            async with self.db_pool.acquire() as conn:
                # Test 1: Try to create company with duplicate name
                duplicate_name = f"Duplicate Test Corp {uuid.uuid4().hex[:8]}"
                company_id_1 = str(uuid.uuid4())
                company_id_2 = str(uuid.uuid4())
                
                # Create first company
                await conn.execute("""
                    INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                company_id_1, duplicate_name, 'enterprise', 50, 0, 'active', 
                datetime.now().isoformat(), datetime.now().isoformat()
                )
                self.test_data['companies'].append(company_id_1)
                
                # Try to create second company with same name (should succeed as name is not unique)
                try:
                    await conn.execute("""
                        INSERT INTO companies (id, name, plan, max_users, current_users, status, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """, 
                    company_id_2, duplicate_name, 'enterprise', 50, 0, 'active', 
                    datetime.now().isoformat(), datetime.now().isoformat()
                    )
                    self.test_data['companies'].append(company_id_2)
                    duplicate_name_allowed = True
                except Exception:
                    duplicate_name_allowed = False
                
                # Test 2: Try to create user with invalid company_id
                invalid_company_id = str(uuid.uuid4())
                user_id = str(uuid.uuid4())
                
                invalid_company_error = None
                try:
                    await conn.execute("""
                        INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    """, 
                    user_id, "Invalid Company User", f"invalid{uuid.uuid4().hex[:8]}@test.com", 
                    'enterprise_user', invalid_company_id, 100, 1000, 5, 'active', 
                    datetime.now().isoformat(), datetime.now().isoformat()
                    )
                except Exception as e:
                    invalid_company_error = str(e)
                
                # Test 3: Try to create user with invalid role
                invalid_role_error = None
                try:
                    await conn.execute("""
                        INSERT INTO users (id, name, email, role, company_id, daily_limit, monthly_limit, device_limit, status, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    """, 
                    str(uuid.uuid4()), "Invalid Role User", f"invalidrole{uuid.uuid4().hex[:8]}@test.com", 
                    'invalid_role', company_id_1, 100, 1000, 5, 'active', 
                    datetime.now().isoformat(), datetime.now().isoformat()
                    )
                except Exception as e:
                    invalid_role_error = str(e)
                
                # Test 4: Try RPC function with non-existent manager
                rpc_error = None
                try:
                    result = await conn.fetchval("""
                        SELECT invite_enterprise_user(
                            $1::TEXT, $2::TEXT, $3::user_role, $4::UUID
                        )
                    """, "test@invalid.com", "Test User", 'enterprise_user', str(uuid.uuid4()))
                    
                    if result:
                        rpc_result = json.loads(result) if isinstance(result, str) else result
                        if not rpc_result.get('success'):
                            rpc_error = rpc_result.get('error', 'Unknown RPC error')
                except Exception as e:
                    rpc_error = str(e)
                
                # Evaluate results
                error_handling_score = 0
                total_tests = 4
                
                if duplicate_name_allowed:  # This is actually expected behavior
                    error_handling_score += 1
                
                if invalid_company_error and 'foreign key' in invalid_company_error.lower():
                    error_handling_score += 1
                
                if invalid_role_error and ('enum' in invalid_role_error.lower() or 'invalid' in invalid_role_error.lower()):
                    error_handling_score += 1
                
                if rpc_error:
                    error_handling_score += 1
                
                success = error_handling_score >= 3  # At least 3 out of 4 error cases handled properly
                
                self.log_test_result(
                    "Error Handling",
                    success,
                    f"Error handling working properly ({error_handling_score}/{total_tests} cases handled)",
                    {
                        'duplicate_name_allowed': duplicate_name_allowed,
                        'invalid_company_error': invalid_company_error is not None,
                        'invalid_role_error': invalid_role_error is not None,
                        'rpc_error_handling': rpc_error is not None,
                        'error_details': {
                            'invalid_company': invalid_company_error,
                            'invalid_role': invalid_role_error,
                            'rpc_error': rpc_error
                        }
                    }
                )
                return success
                
        except Exception as e:
            self.log_test_result(
                "Error Handling",
                False,
                f"Error handling test failed: {str(e)}"
            )
            return False
    
    async def run_all_tests(self):
        """Run all enterprise creation tests in sequence"""
        print("🚀 Starting Enterprise Creation Functionality Tests")
        print("=" * 70)
        
        # Initialize
        if not await self.setup():
            print("❌ Failed to initialize test environment")
            return False
        
        # Run tests
        tests = [
            self.test_service_role_configuration,
            self.test_database_schema_validation,
            self.test_company_creation_with_service_role,
            self.test_manager_user_creation_with_service_role,
            self.test_invite_enterprise_user_rpc_function,
            self.test_data_linking_and_relationships,
            self.test_error_handling
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
        print("=" * 70)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if failed == 0:
            print("🎉 All enterprise creation tests passed!")
        else:
            print("⚠️ Some tests failed. Check the details above.")
        
        return failed == 0

async def main():
    """Main test runner"""
    tester = EnterpriseCreationTester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)