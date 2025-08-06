-- MailoReply AI - COMPLETE User Limits and Usage Functions Update
-- This script corrects all user limits and usage enforcement

-- 1. Corrected User Limits Function
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

-- 2. Updated Usage Enforcement Function (Corrected for Pro users)
CREATE OR REPLACE FUNCTION public.can_user_generate(user_uuid UUID)
RETURNS boolean AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Reset counters if needed
  PERFORM public.reset_daily_usage();
  PERFORM public.reset_monthly_usage();
  
  -- Get user with current usage
  SELECT role, daily_limit, monthly_limit, daily_usage, monthly_usage
  INTO user_record
  FROM public.users 
  WHERE id = user_uuid AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check limits based on role
  CASE user_record.role
    -- Free users: Check both daily and monthly limits
    WHEN 'free' THEN
      IF user_record.daily_usage >= user_record.daily_limit THEN
        RETURN false; -- Daily limit exceeded
      END IF;
      IF user_record.monthly_usage >= user_record.monthly_limit THEN
        RETURN false; -- Monthly limit exceeded
      END IF;
      RETURN true;
    
    -- Pro users: Unlimited daily, check monthly limit only
    WHEN 'pro' THEN
      IF user_record.monthly_usage >= user_record.monthly_limit THEN
        RETURN false; -- Monthly limit exceeded
      END IF;
      RETURN true;
    
    -- Pro Plus: Unlimited everything
    WHEN 'pro_plus' THEN
      RETURN true;
    
    -- Enterprise users: Unlimited everything
    WHEN 'enterprise_user' THEN
      RETURN true;
    
    -- Enterprise managers: Unlimited everything
    WHEN 'enterprise_manager' THEN
      RETURN true;
    
    -- Superusers: Unlimited everything
    WHEN 'superuser' THEN
      RETURN true;
    
    -- Default to free user behavior
    ELSE
      IF user_record.daily_usage >= 3 THEN
        RETURN false;
      END IF;
      IF user_record.monthly_usage >= 30 THEN
        RETURN false;
      END IF;
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 3. Updated Usage Increment Function (Support all roles correctly)
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid UUID)
RETURNS void AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Reset counters if needed
  PERFORM public.reset_daily_usage();
  PERFORM public.reset_monthly_usage();
  
  -- Get user role
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Increment usage based on role
  CASE user_role
    -- Free users: Track both daily and monthly
    WHEN 'free' THEN
      UPDATE public.users 
      SET 
        daily_usage = daily_usage + 1,
        monthly_usage = monthly_usage + 1,
        updated_at = NOW()
      WHERE id = user_uuid;
    
    -- Pro users: Track monthly only (unlimited daily)
    WHEN 'pro' THEN
      UPDATE public.users 
      SET 
        monthly_usage = monthly_usage + 1,
        updated_at = NOW()
      WHERE id = user_uuid;
    
    -- All unlimited users: Don't track usage (but update timestamp)
    WHEN 'pro_plus', 'enterprise_user', 'enterprise_manager', 'superuser' THEN
      UPDATE public.users 
      SET updated_at = NOW()
      WHERE id = user_uuid;
    
    -- Default: Track like free user
    ELSE
      UPDATE public.users 
      SET 
        daily_usage = daily_usage + 1,
        monthly_usage = monthly_usage + 1,
        updated_at = NOW()
      WHERE id = user_uuid;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 4. Device Limit Check Function
CREATE OR REPLACE FUNCTION public.can_register_device(user_uuid UUID, device_fingerprint TEXT)
RETURNS boolean AS $$
DECLARE
  user_device_limit INTEGER;
  current_device_count INTEGER;
  device_exists BOOLEAN;
BEGIN
  -- Get user's device limit
  SELECT device_limit INTO user_device_limit
  FROM public.users 
  WHERE id = user_uuid AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Unlimited devices (superuser)
  IF user_device_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Check if this exact device is already registered
  SELECT EXISTS(
    SELECT 1 FROM public.user_devices 
    WHERE user_id = user_uuid AND device_fingerprint = device_fingerprint
  ) INTO device_exists;
  
  -- If device already exists, allow (user can re-authenticate on same device)
  IF device_exists THEN
    RETURN true;
  END IF;
  
  -- Count current registered devices
  SELECT COUNT(*) INTO current_device_count
  FROM public.user_devices 
  WHERE user_id = user_uuid;
  
  -- Check if user can register a new device
  RETURN current_device_count < user_device_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. Update trigger
DROP TRIGGER IF EXISTS update_user_limits_trigger ON public.users;
CREATE TRIGGER update_user_limits_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_limits();

-- 6. Update existing users to correct limits (if any exist)
UPDATE public.users SET updated_at = NOW() WHERE TRUE;