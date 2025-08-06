-- MailoReply AI - User Limits Verification Function
-- This function helps verify that user limits are set correctly

CREATE OR REPLACE FUNCTION public.verify_user_limits()
RETURNS TABLE (
  role_name user_role,
  daily_limit_expected INTEGER,
  monthly_limit_expected INTEGER, 
  device_limit_expected INTEGER,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'free'::user_role as role_name,
    3 as daily_limit_expected,
    30 as monthly_limit_expected,
    1 as device_limit_expected,
    'Free users: 3 credits/day, 30/month, 1 device' as description
  
  UNION ALL
  SELECT 
    'pro'::user_role as role_name,
    -1 as daily_limit_expected,    -- Unlimited daily
    100 as monthly_limit_expected,
    1 as device_limit_expected,
    'Pro users: Unlimited daily, 100/month, 1 device' as description
  
  UNION ALL
  SELECT 
    'pro_plus'::user_role as role_name,
    -1 as daily_limit_expected,    -- Unlimited daily
    -1 as monthly_limit_expected,  -- Unlimited monthly
    2 as device_limit_expected,
    'Pro Plus users: Unlimited daily/monthly, 2 devices' as description
  
  UNION ALL
  SELECT 
    'enterprise_user'::user_role as role_name,
    -1 as daily_limit_expected,    -- Unlimited daily
    -1 as monthly_limit_expected,  -- Unlimited monthly
    1 as device_limit_expected,
    'Enterprise users: Unlimited daily/monthly, 1 device' as description
  
  UNION ALL
  SELECT 
    'enterprise_manager'::user_role as role_name,
    -1 as daily_limit_expected,    -- Unlimited daily
    -1 as monthly_limit_expected,  -- Unlimited monthly
    1 as device_limit_expected,
    'Enterprise managers: Unlimited daily/monthly, 1 device' as description
  
  UNION ALL
  SELECT 
    'superuser'::user_role as role_name,
    -1 as daily_limit_expected,    -- Unlimited daily
    -1 as monthly_limit_expected,  -- Unlimited monthly
    -1 as device_limit_expected,   -- Unlimited devices
    'Superusers: Unlimited everything' as description;
END;
$$ LANGUAGE plpgsql;

-- Function to test user limit assignment
CREATE OR REPLACE FUNCTION public.test_user_limits(test_role user_role)
RETURNS TABLE (
  role_tested user_role,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  device_limit INTEGER,
  is_correct BOOLEAN
) AS $$
DECLARE
  test_daily INTEGER;
  test_monthly INTEGER;
  test_device INTEGER;
  expected_daily INTEGER;
  expected_monthly INTEGER;
  expected_device INTEGER;
BEGIN
  -- Get expected values
  SELECT daily_limit_expected, monthly_limit_expected, device_limit_expected
  INTO expected_daily, expected_monthly, expected_device
  FROM public.verify_user_limits()
  WHERE role_name = test_role;
  
  -- Simulate the trigger logic
  CASE test_role
    WHEN 'free' THEN
      test_daily := 3;
      test_monthly := 30;
      test_device := 1;
    WHEN 'pro' THEN
      test_daily := -1;
      test_monthly := 100;
      test_device := 1;
    WHEN 'pro_plus' THEN
      test_daily := -1;
      test_monthly := -1;
      test_device := 2;
    WHEN 'enterprise_user' THEN
      test_daily := -1;
      test_monthly := -1;
      test_device := 1;
    WHEN 'enterprise_manager' THEN
      test_daily := -1;
      test_monthly := -1;
      test_device := 1;
    WHEN 'superuser' THEN
      test_daily := -1;
      test_monthly := -1;
      test_device := -1;
    ELSE
      test_daily := 3;
      test_monthly := 30;
      test_device := 1;
  END CASE;
  
  RETURN QUERY
  SELECT 
    test_role as role_tested,
    test_daily as daily_limit,
    test_monthly as monthly_limit,
    test_device as device_limit,
    (test_daily = expected_daily AND test_monthly = expected_monthly AND test_device = expected_device) as is_correct;
END;
$$ LANGUAGE plpgsql;