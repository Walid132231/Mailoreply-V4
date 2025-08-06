-- MailoReply AI - Corrected User Limits Function
-- This function sets the correct limits for each user role

-- Function to set user limits based on role (CORRECTED VERSION)
CREATE OR REPLACE FUNCTION public.update_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits based on role according to requirements
  CASE NEW.role
    WHEN 'free' THEN
      NEW.daily_limit := 3;        -- 3 credits per day
      NEW.monthly_limit := 30;     -- 30 credits per month  
      NEW.device_limit := 1;       -- 1 device only

    WHEN 'pro' THEN
      NEW.daily_limit := -1;       -- No daily limit (unlimited)
      NEW.monthly_limit := 100;    -- 100 credits per month
      NEW.device_limit := 1;       -- 1 device only

    WHEN 'pro_plus' THEN
      NEW.daily_limit := -1;       -- No daily limit (unlimited)
      NEW.monthly_limit := -1;     -- No monthly limit (unlimited)
      NEW.device_limit := 2;       -- 2 devices allowed

    WHEN 'enterprise_user' THEN
      NEW.daily_limit := -1;       -- No daily limit (unlimited)
      NEW.monthly_limit := -1;     -- No monthly limit (unlimited)
      NEW.device_limit := 1;       -- 1 device only

    WHEN 'enterprise_manager' THEN
      NEW.daily_limit := -1;       -- No daily limit (unlimited)
      NEW.monthly_limit := -1;     -- No monthly limit (unlimited)
      NEW.device_limit := 1;       -- 1 device only

    WHEN 'superuser' THEN
      NEW.daily_limit := -1;       -- No daily limit (unlimited)
      NEW.monthly_limit := -1;     -- No monthly limit (unlimited)
      NEW.device_limit := -1;      -- Unlimited devices

    ELSE
      -- Default to free user limits for any undefined roles
      NEW.daily_limit := 3;
      NEW.monthly_limit := 30;
      NEW.device_limit := 1;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use this corrected function
DROP TRIGGER IF EXISTS update_user_limits_trigger ON public.users;
CREATE TRIGGER update_user_limits_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_limits();