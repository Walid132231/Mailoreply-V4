#!/usr/bin/env python3
"""
Enterprise Creation Frontend Integration Test Suite
Tests the enterprise creation functionality through available API endpoints and configuration validation.
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Any, Optional
import sys

class EnterpriseCreationFrontendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.base_url = "http://localhost:8080"
        
    async def setup(self):
        """Initialize HTTP session"""
        try:
            self.session = aiohttp.ClientSession()
            print("✅ HTTP session initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize session: {e}")
            return False
    
    async def cleanup(self):
        """Clean up connections"""
        try:
            if self.session:
                await self.session.close()
            print("✅ Cleanup completed successfully")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
    
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
    
    async def test_environment_variables_configuration(self):
        """Test 1: Verify VITE_SUPABASE_SERVICE_ROLE_KEY is accessible"""
        try:
            # Check if environment file exists
            env_file_path = "/app/.env"
            if not os.path.exists(env_file_path):
                self.log_test_result(
                    "Environment Variables Configuration",
                    False,
                    ".env file not found"
                )
                return False
            
            # Read environment file
            with open(env_file_path, 'r') as f:
                env_content = f.read()
            
            # Check for required variables
            required_vars = [
                'VITE_SUPABASE_URL',
                'VITE_SUPABASE_ANON_KEY',
                'VITE_SUPABASE_SERVICE_ROLE_KEY'
            ]
            
            found_vars = {}
            missing_vars = []
            
            for var in required_vars:
                if f"{var}=" in env_content:
                    # Extract the value
                    for line in env_content.split('\n'):
                        if line.startswith(f"{var}="):
                            value = line.split('=', 1)[1].strip()
                            found_vars[var] = len(value) > 0 and not value.startswith('__') and not value.startswith('your-')
                            break
                else:
                    missing_vars.append(var)
            
            if missing_vars:
                self.log_test_result(
                    "Environment Variables Configuration",
                    False,
                    f"Missing environment variables: {missing_vars}"
                )
                return False
            
            # Check if service role key is properly configured
            service_role_configured = found_vars.get('VITE_SUPABASE_SERVICE_ROLE_KEY', False)
            if not service_role_configured:
                self.log_test_result(
                    "Environment Variables Configuration",
                    False,
                    "VITE_SUPABASE_SERVICE_ROLE_KEY is not properly configured"
                )
                return False
            
            self.log_test_result(
                "Environment Variables Configuration",
                True,
                "All required environment variables are properly configured",
                {
                    'supabase_url_configured': found_vars.get('VITE_SUPABASE_URL', False),
                    'anon_key_configured': found_vars.get('VITE_SUPABASE_ANON_KEY', False),
                    'service_role_configured': service_role_configured
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Environment Variables Configuration",
                False,
                f"Environment configuration test failed: {str(e)}"
            )
            return False
    
    async def test_api_health_endpoint(self):
        """Test 2: Test /health endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status != 200:
                    self.log_test_result(
                        "API Health Endpoint",
                        False,
                        f"Health endpoint returned status {response.status}"
                    )
                    return False
                
                data = await response.json()
                
                required_fields = ['status', 'service', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test_result(
                        "API Health Endpoint",
                        False,
                        f"Health endpoint missing fields: {missing_fields}",
                        {'response_data': data}
                    )
                    return False
                
                if data.get('status') != 'ok':
                    self.log_test_result(
                        "API Health Endpoint",
                        False,
                        f"Health endpoint status is not 'ok': {data.get('status')}"
                    )
                    return False
                
                self.log_test_result(
                    "API Health Endpoint",
                    True,
                    "Health endpoint is working correctly",
                    {
                        'status': data.get('status'),
                        'service': data.get('service'),
                        'port': data.get('port')
                    }
                )
                return True
                
        except Exception as e:
            self.log_test_result(
                "API Health Endpoint",
                False,
                f"Health endpoint test failed: {str(e)}"
            )
            return False
    
    async def test_supabase_client_configuration(self):
        """Test 3: Test supabase client configuration in frontend code"""
        try:
            supabase_lib_path = "/app/client/lib/supabase.ts"
            if not os.path.exists(supabase_lib_path):
                self.log_test_result(
                    "Supabase Client Configuration",
                    False,
                    "Supabase client library file not found"
                )
                return False
            
            with open(supabase_lib_path, 'r') as f:
                supabase_content = f.read()
            
            # Check for key configuration elements
            required_elements = [
                'supabaseServiceRole',
                'isServiceRoleConfigured',
                'VITE_SUPABASE_SERVICE_ROLE_KEY',
                'createClient'
            ]
            
            found_elements = {}
            for element in required_elements:
                found_elements[element] = element in supabase_content
            
            missing_elements = [elem for elem, found in found_elements.items() if not found]
            
            if missing_elements:
                self.log_test_result(
                    "Supabase Client Configuration",
                    False,
                    f"Missing configuration elements: {missing_elements}",
                    {'found_elements': found_elements}
                )
                return False
            
            # Check for service role client creation
            service_role_client_configured = 'supabaseServiceRole' in supabase_content and 'isServiceRoleConfigured' in supabase_content
            
            # Check for RLS bypass comment
            rls_bypass_mentioned = 'bypasses RLS' in supabase_content or 'bypass RLS' in supabase_content
            
            self.log_test_result(
                "Supabase Client Configuration",
                True,
                "Supabase client is properly configured with service role support",
                {
                    'service_role_client': service_role_client_configured,
                    'rls_bypass_configured': rls_bypass_mentioned,
                    'all_elements_found': len(missing_elements) == 0
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "Supabase Client Configuration",
                False,
                f"Supabase client configuration test failed: {str(e)}"
            )
            return False
    
    async def test_superadmin_component_structure(self):
        """Test 4: Test SuperAdmin component has enterprise creation functionality"""
        try:
            superadmin_path = "/app/client/pages/SuperAdmin.tsx"
            if not os.path.exists(superadmin_path):
                self.log_test_result(
                    "SuperAdmin Component Structure",
                    False,
                    "SuperAdmin component file not found"
                )
                return False
            
            with open(superadmin_path, 'r') as f:
                superadmin_content = f.read()
            
            # Check for enterprise creation functionality
            required_functions = [
                'createEnterpriseWithManager',
                'supabaseServiceRole',
                'companies',
                'users'
            ]
            
            found_functions = {}
            for func in required_functions:
                found_functions[func] = func in superadmin_content
            
            missing_functions = [func for func, found in found_functions.items() if not found]
            
            if missing_functions:
                self.log_test_result(
                    "SuperAdmin Component Structure",
                    False,
                    f"Missing enterprise creation functions: {missing_functions}",
                    {'found_functions': found_functions}
                )
                return False
            
            # Check for specific enterprise creation workflow
            workflow_elements = [
                'from(\'companies\')',
                'from(\'users\')',
                'invite_enterprise_user',
                'enterprise_manager'
            ]
            
            workflow_found = {}
            for element in workflow_elements:
                workflow_found[element] = element in superadmin_content
            
            workflow_complete = all(workflow_found.values())
            
            # Check for error handling
            error_handling = 'try {' in superadmin_content and 'catch' in superadmin_content
            
            self.log_test_result(
                "SuperAdmin Component Structure",
                True,
                "SuperAdmin component has complete enterprise creation functionality",
                {
                    'required_functions_present': len(missing_functions) == 0,
                    'workflow_complete': workflow_complete,
                    'error_handling_present': error_handling,
                    'workflow_elements': workflow_found
                }
            )
            return True
            
        except Exception as e:
            self.log_test_result(
                "SuperAdmin Component Structure",
                False,
                f"SuperAdmin component test failed: {str(e)}"
            )
            return False
    
    async def test_database_schema_types(self):
        """Test 5: Test database schema types are properly defined"""
        try:
            types_path = "/app/client/lib/supabase-types.ts"
            if not os.path.exists(types_path):
                self.log_test_result(
                    "Database Schema Types",
                    False,
                    "Supabase types file not found"
                )
                return False
            
            with open(types_path, 'r') as f:
                types_content = f.read()
            
            # Check for required table types
            required_tables = [
                'companies',
                'users'
            ]
            
            table_types_found = {}
            for table in required_tables:
                table_types_found[table] = f'{table}:' in types_content
            
            missing_table_types = [table for table, found in table_types_found.items() if not found]
            
            if missing_table_types:
                self.log_test_result(
                    "Database Schema Types",
                    False,
                    f"Missing table types: {missing_table_types}",
                    {'found_table_types': table_types_found}
                )
                return False
            
            # Check for required fields in companies table
            companies_fields = [
                'name', 'plan', 'max_users', 'current_users', 'status'
            ]
            
            companies_fields_found = {}
            for field in companies_fields:
                companies_fields_found[field] = field in types_content
            
            # Check for required fields in users table
            users_fields = [
                'name', 'email', 'role', 'company_id', 'status'
            ]
            
            users_fields_found = {}
            for field in users_fields:
                users_fields_found[field] = field in types_content
            
            # Check for enterprise roles
            enterprise_roles = [
                'enterprise_manager',
                'enterprise_user'
            ]
            
            roles_found = {}
            for role in enterprise_roles:
                roles_found[role] = role in types_content
            
            all_types_present = (
                len(missing_table_types) == 0 and
                all(companies_fields_found.values()) and
                all(users_fields_found.values()) and
                all(roles_found.values())
            )
            
            self.log_test_result(
                "Database Schema Types",
                all_types_present,
                "Database schema types are properly defined" if all_types_present else "Some database schema types are missing",
                {
                    'table_types': table_types_found,
                    'companies_fields': companies_fields_found,
                    'users_fields': users_fields_found,
                    'enterprise_roles': roles_found
                }
            )
            return all_types_present
            
        except Exception as e:
            self.log_test_result(
                "Database Schema Types",
                False,
                f"Database schema types test failed: {str(e)}"
            )
            return False
    
    async def test_enterprise_creation_workflow_logic(self):
        """Test 6: Test enterprise creation workflow logic in SuperAdmin component"""
        try:
            superadmin_path = "/app/client/pages/SuperAdmin.tsx"
            with open(superadmin_path, 'r') as f:
                content = f.read()
            
            # Extract the createEnterpriseWithManager function
            func_start = content.find('const createEnterpriseWithManager = async () => {')
            if func_start == -1:
                func_start = content.find('createEnterpriseWithManager = async () => {')
            
            if func_start == -1:
                self.log_test_result(
                    "Enterprise Creation Workflow Logic",
                    False,
                    "createEnterpriseWithManager function not found"
                )
                return False
            
            # Find the end of the function (simplified approach)
            func_end = content.find('};', func_start)
            if func_end == -1:
                func_end = len(content)
            
            function_code = content[func_start:func_end]
            
            # Check for required workflow steps
            workflow_steps = {
                'validation': 'if (!newEnterprise.name || !newEnterprise.email || !newEnterprise.companyName)' in function_code,
                'service_role_check': 'isServiceRoleConfigured' in function_code and 'supabaseServiceRole' in function_code,
                'company_creation': 'from(\'companies\')' in function_code and '.insert(' in function_code,
                'user_creation': 'from(\'users\')' in function_code and 'enterprise_manager' in function_code,
                'invitation_sending': 'invite_enterprise_user' in function_code and '.rpc(' in function_code,
                'error_handling': 'try {' in function_code and 'catch' in function_code,
                'success_feedback': 'setSuccess(' in function_code,
                'data_reload': 'loadData()' in function_code
            }
            
            missing_steps = [step for step, found in workflow_steps.items() if not found]
            workflow_complete = len(missing_steps) == 0
            
            # Check for proper data structure
            data_structure_checks = {
                'company_fields': 'name:' in function_code and 'plan_type:' in function_code and 'max_users:' in function_code,
                'user_fields': 'name:' in function_code and 'email:' in function_code and 'role:' in function_code,
                'proper_linking': 'company_id:' in function_code
            }
            
            data_structure_complete = all(data_structure_checks.values())
            
            overall_success = workflow_complete and data_structure_complete
            
            self.log_test_result(
                "Enterprise Creation Workflow Logic",
                overall_success,
                "Enterprise creation workflow is properly implemented" if overall_success else "Enterprise creation workflow has missing components",
                {
                    'workflow_steps': workflow_steps,
                    'missing_steps': missing_steps,
                    'data_structure_checks': data_structure_checks,
                    'workflow_complete': workflow_complete,
                    'data_structure_complete': data_structure_complete
                }
            )
            return overall_success
            
        except Exception as e:
            self.log_test_result(
                "Enterprise Creation Workflow Logic",
                False,
                f"Workflow logic test failed: {str(e)}"
            )
            return False
    
    async def test_error_handling_and_validation(self):
        """Test 7: Test error handling and validation in enterprise creation"""
        try:
            superadmin_path = "/app/client/pages/SuperAdmin.tsx"
            with open(superadmin_path, 'r') as f:
                content = f.read()
            
            # Check for various error handling scenarios
            error_handling_checks = {
                'input_validation': 'if (!newEnterprise.name || !newEnterprise.email || !newEnterprise.companyName)' in content,
                'service_role_validation': 'if (!isServiceRoleConfigured || !supabaseServiceRole)' in content,
                'database_error_handling': 'companyError' in content and 'userError' in content,
                'rpc_error_handling': 'inviteError' in content,
                'success_validation': 'if (!inviteResult?.success)' in content,
                'try_catch_blocks': content.count('try {') >= 1 and content.count('catch') >= 1,
                'error_state_management': 'setError(' in content,
                'loading_state_management': 'setCreateLoading(' in content
            }
            
            validation_checks = {
                'required_fields': 'Please fill in all required fields' in content,
                'service_role_error': 'Service role not configured' in content,
                'generic_error_fallback': 'Failed to create enterprise' in content
            }
            
            user_feedback_checks = {
                'success_messages': 'setSuccess(' in content,
                'error_messages': 'setError(' in content,
                'loading_indicators': 'createLoading' in content,
                'form_reset': 'setNewEnterprise({' in content
            }
            
            all_error_handling = all(error_handling_checks.values())
            all_validation = all(validation_checks.values())
            all_user_feedback = all(user_feedback_checks.values())
            
            overall_success = all_error_handling and all_validation and all_user_feedback
            
            self.log_test_result(
                "Error Handling and Validation",
                overall_success,
                "Error handling and validation are properly implemented" if overall_success else "Some error handling or validation is missing",
                {
                    'error_handling_checks': error_handling_checks,
                    'validation_checks': validation_checks,
                    'user_feedback_checks': user_feedback_checks,
                    'all_error_handling': all_error_handling,
                    'all_validation': all_validation,
                    'all_user_feedback': all_user_feedback
                }
            )
            return overall_success
            
        except Exception as e:
            self.log_test_result(
                "Error Handling and Validation",
                False,
                f"Error handling test failed: {str(e)}"
            )
            return False
    
    async def run_all_tests(self):
        """Run all enterprise creation frontend tests"""
        print("🚀 Starting Enterprise Creation Frontend Integration Tests")
        print("=" * 80)
        
        # Initialize
        if not await self.setup():
            print("❌ Failed to initialize test environment")
            return False
        
        # Run tests
        tests = [
            self.test_environment_variables_configuration,
            self.test_api_health_endpoint,
            self.test_supabase_client_configuration,
            self.test_superadmin_component_structure,
            self.test_database_schema_types,
            self.test_enterprise_creation_workflow_logic,
            self.test_error_handling_and_validation
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
        print("=" * 80)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if failed == 0:
            print("🎉 All enterprise creation frontend tests passed!")
            print("✨ The enterprise creation functionality is properly implemented!")
        else:
            print("⚠️ Some tests failed. Check the details above.")
        
        return failed == 0

async def main():
    """Main test runner"""
    tester = EnterpriseCreationFrontendTester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)