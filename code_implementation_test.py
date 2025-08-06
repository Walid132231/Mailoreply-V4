#!/usr/bin/env python3
"""
Code Implementation Test Suite for Enhanced Features
Tests the actual code implementation of enhanced features by examining source files
"""

import os
import json
import re
from typing import Dict, Any, Optional, List

class CodeImplementationTester:
    def __init__(self):
        self.test_results = []
        self.base_path = "/app"
        
    def log_result(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")

    def read_file_safe(self, file_path: str) -> Optional[str]:
        """Safely read a file and return its content"""
        try:
            full_path = os.path.join(self.base_path, file_path.lstrip('/'))
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    return f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
        return None

    def test_enhanced_settings_billing_section(self):
        """Test that Settings page has enhanced billing section"""
        try:
            settings_content = self.read_file_safe("client/pages/Settings.tsx")
            
            if not settings_content:
                self.log_result(
                    "Enhanced Settings Billing Section",
                    False,
                    "Settings.tsx file not found",
                    {}
                )
                return False
            
            # Check for billing-related elements
            billing_indicators = [
                "billing",
                "SubscriptionManager",
                "Crown",
                "TabsTrigger.*billing",
                "TabsContent.*billing"
            ]
            
            found_indicators = {}
            for indicator in billing_indicators:
                found_indicators[indicator] = bool(re.search(indicator, settings_content, re.IGNORECASE))
            
            # Check if SubscriptionManager is imported and used
            subscription_manager_imported = "SubscriptionManager" in settings_content
            billing_tab_exists = "billing" in settings_content.lower()
            
            billing_section_implemented = subscription_manager_imported and billing_tab_exists
            
            self.log_result(
                "Enhanced Settings Billing Section",
                billing_section_implemented,
                "Billing section with SubscriptionManager implemented" if billing_section_implemented else "Billing section not fully implemented",
                {
                    "subscription_manager_imported": subscription_manager_imported,
                    "billing_tab_exists": billing_tab_exists,
                    "found_indicators": found_indicators
                }
            )
            
            return billing_section_implemented
            
        except Exception as e:
            self.log_result(
                "Enhanced Settings Billing Section",
                False,
                f"Error testing billing section: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_google_oauth_integration(self):
        """Test Google OAuth integration in AuthContext"""
        try:
            auth_context_content = self.read_file_safe("client/contexts/AuthContext.tsx")
            
            if not auth_context_content:
                self.log_result(
                    "Google OAuth Integration",
                    False,
                    "AuthContext.tsx file not found",
                    {}
                )
                return False
            
            # Check for Google OAuth functions
            oauth_functions = [
                "loginWithGoogle",
                "signupWithGoogle",
                "signInWithOAuth",
                "provider.*google"
            ]
            
            found_functions = {}
            for func in oauth_functions:
                found_functions[func] = bool(re.search(func, auth_context_content, re.IGNORECASE))
            
            # Check if OAuth functions are properly implemented
            login_with_google_exists = "loginWithGoogle" in auth_context_content
            signup_with_google_exists = "signupWithGoogle" in auth_context_content
            oauth_provider_configured = "provider: 'google'" in auth_context_content
            
            oauth_implemented = login_with_google_exists and signup_with_google_exists and oauth_provider_configured
            
            self.log_result(
                "Google OAuth Integration",
                oauth_implemented,
                "Google OAuth functions properly implemented" if oauth_implemented else "Google OAuth functions not fully implemented",
                {
                    "login_with_google_exists": login_with_google_exists,
                    "signup_with_google_exists": signup_with_google_exists,
                    "oauth_provider_configured": oauth_provider_configured,
                    "found_functions": found_functions
                }
            )
            
            return oauth_implemented
            
        except Exception as e:
            self.log_result(
                "Google OAuth Integration",
                False,
                f"Error testing OAuth integration: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_stripe_integration_implementation(self):
        """Test Stripe integration implementation"""
        try:
            # Check Stripe API client
            stripe_api_content = self.read_file_safe("client/lib/stripe-api.ts")
            stripe_config_content = self.read_file_safe("client/lib/stripe.ts")
            stripe_netlify_content = self.read_file_safe("netlify/functions/stripe-api.ts")
            
            results = {
                "stripe_api_client": stripe_api_content is not None,
                "stripe_config": stripe_config_content is not None,
                "stripe_netlify_function": stripe_netlify_content is not None
            }
            
            if stripe_api_content:
                # Check for key Stripe API methods
                stripe_methods = [
                    "createCheckoutSession",
                    "createPortalSession",
                    "getUserSubscription",
                    "cancelSubscription",
                    "reactivateSubscription"
                ]
                
                for method in stripe_methods:
                    results[f"method_{method}"] = method in stripe_api_content
            
            if stripe_config_content:
                # Check for plan configurations
                config_elements = [
                    "STRIPE_CONFIG",
                    "PLAN_LIMITS",
                    "PRICE_DISPLAY",
                    "pro_monthly",
                    "pro_plus"
                ]
                
                for element in config_elements:
                    results[f"config_{element}"] = element in stripe_config_content
            
            if stripe_netlify_content:
                # Check for webhook handling
                webhook_elements = [
                    "handleWebhook",
                    "handleSubscriptionChange",
                    "handlePaymentSucceeded",
                    "role.*pro",
                    "role.*pro_plus"
                ]
                
                for element in webhook_elements:
                    results[f"webhook_{element}"] = bool(re.search(element, stripe_netlify_content, re.IGNORECASE))
            
            # Overall assessment
            core_stripe_implemented = (
                results.get("stripe_api_client", False) and
                results.get("stripe_config", False) and
                results.get("method_createCheckoutSession", False) and
                results.get("method_getUserSubscription", False)
            )
            
            self.log_result(
                "Stripe Integration Implementation",
                core_stripe_implemented,
                "Core Stripe integration implemented" if core_stripe_implemented else "Stripe integration incomplete",
                results
            )
            
            return core_stripe_implemented
            
        except Exception as e:
            self.log_result(
                "Stripe Integration Implementation",
                False,
                f"Error testing Stripe integration: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_subscription_manager_component(self):
        """Test SubscriptionManager component implementation"""
        try:
            subscription_manager_content = self.read_file_safe("client/components/SubscriptionManager.tsx")
            
            if not subscription_manager_content:
                self.log_result(
                    "SubscriptionManager Component",
                    False,
                    "SubscriptionManager.tsx file not found",
                    {}
                )
                return False
            
            # Check for key SubscriptionManager features
            features = [
                "loadSubscriptionData",
                "handleManageBilling",
                "handleCancelSubscription",
                "handleReactivateSubscription",
                "StripeAPI",
                "UserSubscription",
                "PLAN_LIMITS",
                "formatAmount",
                "getStatusBadge"
            ]
            
            found_features = {}
            for feature in features:
                found_features[feature] = feature in subscription_manager_content
            
            # Check for UI elements
            ui_elements = [
                "Current Subscription",
                "Payment History",
                "Manage Billing",
                "Cancel Subscription",
                "Reactivate Subscription"
            ]
            
            found_ui_elements = {}
            for element in ui_elements:
                found_ui_elements[element] = element in subscription_manager_content
            
            # Overall assessment
            core_features_implemented = (
                found_features.get("loadSubscriptionData", False) and
                found_features.get("StripeAPI", False) and
                found_features.get("UserSubscription", False) and
                found_ui_elements.get("Current Subscription", False)
            )
            
            self.log_result(
                "SubscriptionManager Component",
                core_features_implemented,
                "SubscriptionManager component fully implemented" if core_features_implemented else "SubscriptionManager component incomplete",
                {
                    "found_features": found_features,
                    "found_ui_elements": found_ui_elements
                }
            )
            
            return core_features_implemented
            
        except Exception as e:
            self.log_result(
                "SubscriptionManager Component",
                False,
                f"Error testing SubscriptionManager: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_n8n_integration_implementation(self):
        """Test N8N integration implementation"""
        try:
            n8n_service_content = self.read_file_safe("client/lib/n8n-service.ts")
            
            if not n8n_service_content:
                self.log_result(
                    "N8N Integration Implementation",
                    False,
                    "n8n-service.ts file not found",
                    {}
                )
                return False
            
            # Check for key N8N functions
            n8n_functions = [
                "generateAIReply",
                "generateAIEmail",
                "testN8NConnection",
                "isN8NConfigured",
                "generateMockReply",
                "generateMockEmail"
            ]
            
            found_functions = {}
            for func in n8n_functions:
                found_functions[func] = func in n8n_service_content
            
            # Check for configuration
            config_elements = [
                "N8N_REPLY_WEBHOOK_URL",
                "N8N_EMAIL_WEBHOOK_URL",
                "N8N_WEBHOOK_TOKEN",
                "encryptMessage"
            ]
            
            found_config = {}
            for element in config_elements:
                found_config[element] = element in n8n_service_content
            
            # Check for proper error handling and fallbacks
            fallback_elements = [
                "mock response",
                "N8N not configured",
                "generateMockReply",
                "generateMockEmail"
            ]
            
            found_fallbacks = {}
            for element in fallback_elements:
                found_fallbacks[element] = element in n8n_service_content
            
            # Overall assessment
            n8n_implemented = (
                found_functions.get("generateAIReply", False) and
                found_functions.get("generateAIEmail", False) and
                found_functions.get("generateMockReply", False) and
                found_config.get("N8N_REPLY_WEBHOOK_URL", False)
            )
            
            self.log_result(
                "N8N Integration Implementation",
                n8n_implemented,
                "N8N integration with fallbacks implemented" if n8n_implemented else "N8N integration incomplete",
                {
                    "found_functions": found_functions,
                    "found_config": found_config,
                    "found_fallbacks": found_fallbacks
                }
            )
            
            return n8n_implemented
            
        except Exception as e:
            self.log_result(
                "N8N Integration Implementation",
                False,
                f"Error testing N8N integration: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_role_upgrade_webhook_logic(self):
        """Test role upgrade logic in Stripe webhook"""
        try:
            stripe_netlify_content = self.read_file_safe("netlify/functions/stripe-api.ts")
            
            if not stripe_netlify_content:
                self.log_result(
                    "Role Upgrade Webhook Logic",
                    False,
                    "stripe-api.ts netlify function not found",
                    {}
                )
                return False
            
            # Check for role mapping logic
            role_mapping_patterns = [
                r"price_pro_monthly.*pro",
                r"price_pro_yearly.*pro",
                r"price_pro_plus_monthly.*pro_plus",
                r"price_pro_plus_yearly.*pro_plus",
                r"priceToRoleMap",
                r"userRole.*=.*priceToRoleMap"
            ]
            
            found_patterns = {}
            for pattern in role_mapping_patterns:
                found_patterns[pattern] = bool(re.search(pattern, stripe_netlify_content, re.IGNORECASE))
            
            # Check for subscription handling functions
            webhook_functions = [
                "handleSubscriptionChange",
                "handleSubscriptionDeleted",
                "handlePaymentSucceeded",
                "handlePaymentFailed"
            ]
            
            found_webhook_functions = {}
            for func in webhook_functions:
                found_webhook_functions[func] = func in stripe_netlify_content
            
            # Check for user role updates
            role_update_patterns = [
                r"update.*role",
                r"users.*update.*role",
                r"role.*free",
                r"role.*pro"
            ]
            
            found_role_updates = {}
            for pattern in role_update_patterns:
                found_role_updates[pattern] = bool(re.search(pattern, stripe_netlify_content, re.IGNORECASE))
            
            # Overall assessment
            role_upgrade_implemented = (
                found_patterns.get(r"price_pro_monthly.*pro", False) and
                found_patterns.get(r"price_pro_plus_monthly.*pro_plus", False) and
                found_webhook_functions.get("handleSubscriptionChange", False) and
                any(found_role_updates.values())
            )
            
            self.log_result(
                "Role Upgrade Webhook Logic",
                role_upgrade_implemented,
                "Role upgrade webhook logic implemented" if role_upgrade_implemented else "Role upgrade logic incomplete",
                {
                    "found_patterns": found_patterns,
                    "found_webhook_functions": found_webhook_functions,
                    "found_role_updates": found_role_updates
                }
            )
            
            return role_upgrade_implemented
            
        except Exception as e:
            self.log_result(
                "Role Upgrade Webhook Logic",
                False,
                f"Error testing role upgrade logic: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_button_connectivity_implementation(self):
        """Test button connectivity implementation"""
        try:
            # Check if upgrade buttons are properly connected
            results = {}
            
            # Check Settings page for upgrade buttons
            settings_content = self.read_file_safe("client/pages/Settings.tsx")
            if settings_content:
                upgrade_button_patterns = [
                    r"upgrade.*button",
                    r"view.*upgrade.*options",
                    r"stripe.*checkout",
                    r"createCheckoutSession"
                ]
                
                for pattern in upgrade_button_patterns:
                    results[f"settings_{pattern}"] = bool(re.search(pattern, settings_content, re.IGNORECASE))
            
            # Check SubscriptionManager for billing buttons
            subscription_manager_content = self.read_file_safe("client/components/SubscriptionManager.tsx")
            if subscription_manager_content:
                billing_button_patterns = [
                    r"manage.*billing",
                    r"cancel.*subscription",
                    r"reactivate.*subscription",
                    r"handleManageBilling",
                    r"handleCancelSubscription"
                ]
                
                for pattern in billing_button_patterns:
                    results[f"billing_{pattern}"] = bool(re.search(pattern, subscription_manager_content, re.IGNORECASE))
            
            # Check for AI generation button connectivity
            # This would typically be in dashboard or email generation components
            # For now, check if N8N service is properly integrated
            n8n_service_content = self.read_file_safe("client/lib/n8n-service.ts")
            if n8n_service_content:
                ai_button_patterns = [
                    r"generateAIReply",
                    r"generateAIEmail",
                    r"GenerationRequest",
                    r"GenerationResponse"
                ]
                
                for pattern in ai_button_patterns:
                    results[f"ai_{pattern}"] = bool(re.search(pattern, n8n_service_content, re.IGNORECASE))
            
            # Overall assessment
            upgrade_buttons_connected = any(
                results.get(key, False) for key in results.keys() 
                if "upgrade" in key or "billing" in key
            )
            
            ai_buttons_connected = any(
                results.get(key, False) for key in results.keys() 
                if "ai_" in key
            )
            
            overall_connectivity = upgrade_buttons_connected and ai_buttons_connected
            
            self.log_result(
                "Button Connectivity Implementation",
                overall_connectivity,
                "Button connectivity properly implemented" if overall_connectivity else "Button connectivity incomplete",
                {
                    "upgrade_buttons_connected": upgrade_buttons_connected,
                    "ai_buttons_connected": ai_buttons_connected,
                    "detailed_results": results
                }
            )
            
            return overall_connectivity
            
        except Exception as e:
            self.log_result(
                "Button Connectivity Implementation",
                False,
                f"Error testing button connectivity: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_environment_configuration_files(self):
        """Test environment configuration files"""
        try:
            # Check for environment configuration
            env_files = [
                ".env",
                ".env.example",
                "package.json"
            ]
            
            found_files = {}
            for file in env_files:
                content = self.read_file_safe(file)
                found_files[file] = content is not None
                
                if content and file == "package.json":
                    # Check for required dependencies
                    dependencies = [
                        "@stripe/stripe-js",
                        "@supabase/supabase-js",
                        "stripe"
                    ]
                    
                    for dep in dependencies:
                        found_files[f"dependency_{dep}"] = dep in content
            
            # Check for Stripe and Supabase configuration
            env_content = self.read_file_safe(".env")
            if env_content:
                env_vars = [
                    "VITE_STRIPE_PUBLISHABLE_KEY",
                    "STRIPE_SECRET_KEY",
                    "VITE_SUPABASE_URL",
                    "SUPABASE_SERVICE_ROLE_KEY",
                    "VITE_N8N_REPLY_WEBHOOK_URL",
                    "VITE_N8N_EMAIL_WEBHOOK_URL"
                ]
                
                for var in env_vars:
                    found_files[f"env_{var}"] = var in env_content
            
            # Overall assessment
            core_config_present = (
                found_files.get("package.json", False) and
                found_files.get("dependency_@stripe/stripe-js", False) and
                found_files.get("dependency_@supabase/supabase-js", False)
            )
            
            self.log_result(
                "Environment Configuration Files",
                core_config_present,
                "Core environment configuration present" if core_config_present else "Environment configuration incomplete",
                found_files
            )
            
            return core_config_present
            
        except Exception as e:
            self.log_result(
                "Environment Configuration Files",
                False,
                f"Error testing environment configuration: {str(e)}",
                {"error": str(e)}
            )
            return False

    def test_overall_code_integration(self):
        """Test overall code integration and architecture"""
        try:
            # Check for proper imports and exports
            key_files = [
                "client/contexts/AuthContext.tsx",
                "client/pages/Settings.tsx", 
                "client/components/SubscriptionManager.tsx",
                "client/lib/stripe-api.ts",
                "client/lib/n8n-service.ts",
                "netlify/functions/stripe-api.ts"
            ]
            
            integration_results = {}
            
            for file_path in key_files:
                content = self.read_file_safe(file_path)
                if content:
                    # Check for proper TypeScript/React patterns
                    patterns = [
                        r"import.*from",
                        r"export.*function|export.*class|export.*default",
                        r"interface.*{",
                        r"type.*=",
                        r"async.*function|const.*=.*async"
                    ]
                    
                    file_results = {}
                    for pattern in patterns:
                        file_results[pattern] = bool(re.search(pattern, content))
                    
                    integration_results[file_path] = file_results
                else:
                    integration_results[file_path] = {"file_exists": False}
            
            # Check for cross-file integration
            auth_context_content = self.read_file_safe("client/contexts/AuthContext.tsx")
            settings_content = self.read_file_safe("client/pages/Settings.tsx")
            
            cross_integration = {}
            if auth_context_content and settings_content:
                # Check if Settings uses AuthContext
                cross_integration["settings_uses_auth"] = "useAuth" in settings_content
                cross_integration["auth_exports_functions"] = all(
                    func in auth_context_content for func in ["loginWithGoogle", "signupWithGoogle", "updateUser", "updateSettings"]
                )
            
            # Overall assessment
            files_exist = sum(1 for file_path in key_files if self.read_file_safe(file_path) is not None)
            integration_healthy = files_exist >= len(key_files) * 0.8  # 80% of files exist
            
            self.log_result(
                "Overall Code Integration",
                integration_healthy,
                f"Code integration healthy ({files_exist}/{len(key_files)} files found)" if integration_healthy else "Code integration issues found",
                {
                    "files_found": f"{files_exist}/{len(key_files)}",
                    "integration_results": integration_results,
                    "cross_integration": cross_integration
                }
            )
            
            return integration_healthy
            
        except Exception as e:
            self.log_result(
                "Overall Code Integration",
                False,
                f"Error testing code integration: {str(e)}",
                {"error": str(e)}
            )
            return False

    def run_all_code_tests(self):
        """Run all code implementation tests"""
        print("🔍 Starting Code Implementation Tests for Enhanced Features")
        print("=" * 70)
        
        # Test 1: Enhanced Settings Billing Section
        self.test_enhanced_settings_billing_section()
        
        # Test 2: Google OAuth Integration
        self.test_google_oauth_integration()
        
        # Test 3: Stripe Integration Implementation
        self.test_stripe_integration_implementation()
        
        # Test 4: SubscriptionManager Component
        self.test_subscription_manager_component()
        
        # Test 5: N8N Integration Implementation
        self.test_n8n_integration_implementation()
        
        # Test 6: Role Upgrade Webhook Logic
        self.test_role_upgrade_webhook_logic()
        
        # Test 7: Button Connectivity Implementation
        self.test_button_connectivity_implementation()
        
        # Test 8: Environment Configuration Files
        self.test_environment_configuration_files()
        
        # Test 9: Overall Code Integration
        self.test_overall_code_integration()
        
        # Generate summary
        self.generate_code_test_summary()

    def generate_code_test_summary(self):
        """Generate code test summary"""
        print("\n" + "=" * 70)
        print("📋 CODE IMPLEMENTATION TEST SUMMARY")
        print("=" * 70)
        
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
        
        print("\n🎯 IMPLEMENTATION STATUS BY FEATURE:")
        
        feature_mapping = {
            "Settings Enhancement": ["Enhanced Settings Billing Section", "SubscriptionManager Component"],
            "Authentication": ["Google OAuth Integration"],
            "Payment Processing": ["Stripe Integration Implementation", "Role Upgrade Webhook Logic"],
            "AI Integration": ["N8N Integration Implementation"],
            "User Interface": ["Button Connectivity Implementation"],
            "Configuration": ["Environment Configuration Files"],
            "Architecture": ["Overall Code Integration"]
        }
        
        for category, tests in feature_mapping.items():
            category_results = [r for r in self.test_results if r["test"] in tests]
            if category_results:
                passed = len([r for r in category_results if r["success"]])
                total = len(category_results)
                status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
                print(f"\n{status} {category}: {passed}/{total}")
                for result in category_results:
                    test_status = "✅" if result["success"] else "❌"
                    print(f"  {test_status} {result['test']}")
        
        print("\n🚀 DEPLOYMENT READINESS ASSESSMENT:")
        
        critical_features = [
            "Enhanced Settings Billing Section",
            "Stripe Integration Implementation", 
            "SubscriptionManager Component",
            "Overall Code Integration"
        ]
        
        critical_passed = len([
            r for r in self.test_results 
            if r["test"] in critical_features and r["success"]
        ])
        
        if critical_passed == len(critical_features):
            print("🟢 READY - All critical features implemented")
        elif critical_passed >= len(critical_features) * 0.75:
            print("🟡 MOSTLY READY - Most critical features implemented")
        else:
            print("🔴 NOT READY - Critical features missing")
        
        print(f"\nCritical Features: {critical_passed}/{len(critical_features)} ✅")
        
        # Save results
        with open("/app/code_implementation_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Results saved to: /app/code_implementation_test_results.json")

if __name__ == "__main__":
    tester = CodeImplementationTester()
    tester.run_all_code_tests()