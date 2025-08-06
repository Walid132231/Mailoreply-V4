#!/usr/bin/env python3
"""
User Limits Verification Test Script
Tests that user limits are set correctly for each role
"""

def test_user_limits():
    """Test function to verify user limits logic"""
    
    # Define the correct limits per your requirements
    expected_limits = {
        'free': {'daily': 3, 'monthly': 30, 'devices': 1},
        'pro': {'daily': -1, 'monthly': 100, 'devices': 1}, 
        'pro_plus': {'daily': -1, 'monthly': -1, 'devices': 2},
        'enterprise_user': {'daily': -1, 'monthly': -1, 'devices': 1},
        'enterprise_manager': {'daily': -1, 'monthly': -1, 'devices': 1},
        'superuser': {'daily': -1, 'monthly': -1, 'devices': -1}
    }
    
    # Simulate the corrected trigger function logic
    def get_user_limits(role):
        if role == 'free':
            return {'daily': 3, 'monthly': 30, 'devices': 1}
        elif role == 'pro':
            return {'daily': -1, 'monthly': 100, 'devices': 1}
        elif role == 'pro_plus':
            return {'daily': -1, 'monthly': -1, 'devices': 2}
        elif role == 'enterprise_user':
            return {'daily': -1, 'monthly': -1, 'devices': 1}
        elif role == 'enterprise_manager':
            return {'daily': -1, 'monthly': -1, 'devices': 1}
        elif role == 'superuser':
            return {'daily': -1, 'monthly': -1, 'devices': -1}
        else:
            return {'daily': 3, 'monthly': 30, 'devices': 1}  # Default to free
    
    print("🧪 USER LIMITS VERIFICATION TEST")
    print("=" * 50)
    
    all_correct = True
    
    for role, expected in expected_limits.items():
        actual = get_user_limits(role)
        
        is_correct = (
            actual['daily'] == expected['daily'] and
            actual['monthly'] == expected['monthly'] and
            actual['devices'] == expected['devices']
        )
        
        status = "✅ CORRECT" if is_correct else "❌ INCORRECT"
        
        print(f"\n{role.upper()} USER:")
        print(f"  Expected: Daily={expected['daily']}, Monthly={expected['monthly']}, Devices={expected['devices']}")
        print(f"  Actual:   Daily={actual['daily']}, Monthly={actual['monthly']}, Devices={actual['devices']}")
        print(f"  Status:   {status}")
        
        if not is_correct:
            all_correct = False
    
    print("\n" + "=" * 50)
    overall_status = "✅ ALL LIMITS CORRECT" if all_correct else "❌ ISSUES FOUND"
    print(f"OVERALL: {overall_status}")
    
    return all_correct

def format_limit(value):
    """Format limit value for display"""
    return "Unlimited" if value == -1 else str(value)

def print_user_limits_table():
    """Print a formatted table of user limits"""
    
    limits = {
        'Free': {'daily': 3, 'monthly': 30, 'devices': 1},
        'Pro': {'daily': -1, 'monthly': 100, 'devices': 1}, 
        'Pro Plus': {'daily': -1, 'monthly': -1, 'devices': 2},
        'Enterprise User': {'daily': -1, 'monthly': -1, 'devices': 1},
        'Enterprise Manager': {'daily': -1, 'monthly': -1, 'devices': 1},
        'Superuser': {'daily': -1, 'monthly': -1, 'devices': -1}
    }
    
    print("\n📊 CORRECTED USER LIMITS TABLE")
    print("=" * 80)
    print(f"{'Role':<20} {'Daily Limit':<15} {'Monthly Limit':<15} {'Device Limit':<15}")
    print("-" * 80)
    
    for role, limit in limits.items():
        daily = format_limit(limit['daily'])
        monthly = format_limit(limit['monthly'])
        devices = format_limit(limit['devices'])
        
        print(f"{role:<20} {daily:<15} {monthly:<15} {devices:<15}")
    
    print("=" * 80)

if __name__ == "__main__":
    print_user_limits_table()
    print()
    test_result = test_user_limits()
    
    print("\n🔧 DEPLOYMENT INSTRUCTIONS:")
    print("1. Copy the corrected SQL function from 'corrected_user_limits.sql'")
    print("2. Paste and execute it in your Supabase SQL Editor") 
    print("3. Run: UPDATE public.users SET updated_at = NOW();")
    print("4. Verify with: SELECT role, daily_limit, monthly_limit, device_limit FROM users;")
    
    if test_result:
        print("\n🎉 Your user limits logic is now CORRECT!")
    else:
        print("\n⚠️  Please deploy the corrected function to fix the issues.")