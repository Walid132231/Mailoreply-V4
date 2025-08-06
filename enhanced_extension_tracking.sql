-- Enhanced Usage Tracking Functions for Website & Extension Integration
-- This ensures proper tracking and limits for both website and extension usage

-- Function to track AI generation with source tracking
CREATE OR REPLACE FUNCTION public.track_ai_generation(
  user_uuid UUID,
  generation_source generation_source,
  generation_type TEXT,
  language TEXT DEFAULT 'en',
  tone TEXT DEFAULT 'professional',
  intent TEXT DEFAULT NULL,
  input_length INTEGER DEFAULT 0,
  output_length INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
  can_generate BOOLEAN;
BEGIN
  -- First check if user can generate
  SELECT public.can_user_generate(user_uuid) INTO can_generate;
  
  IF NOT can_generate THEN
    RAISE EXCEPTION 'User has reached generation limits';
  END IF;

  -- Get user role for company tracking
  SELECT role INTO user_role
  FROM public.users 
  WHERE id = user_uuid;

  -- Insert generation record
  INSERT INTO public.ai_generations (
    user_id,
    source,
    generation_type,
    language,
    tone,
    intent,
    input_length,
    output_length,
    success,
    error_message,
    created_at
  ) VALUES (
    user_uuid,
    generation_source,
    generation_type,
    language,
    tone,
    intent,
    input_length,
    output_length,
    success,
    error_message,
    NOW()
  );

  -- Increment usage counters only for successful generations
  IF success THEN
    PERFORM public.increment_user_usage(user_uuid);
  END IF;

  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail completely
    INSERT INTO public.ai_generations (
      user_id,
      source,
      generation_type,
      language,
      tone,
      input_length,
      success,
      error_message,
      created_at
    ) VALUES (
      user_uuid,
      generation_source,
      generation_type,
      language,
      tone,
      input_length,
      false,
      SQLERRM,
      NOW()
    );
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to get enhanced usage statistics with source breakdown
CREATE OR REPLACE FUNCTION public.get_user_usage_breakdown(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_data RECORD;
  website_today INTEGER;
  extension_today INTEGER;
  website_month INTEGER;
  extension_month INTEGER;
  total_website INTEGER;
  total_extension INTEGER;
  device_count INTEGER;
  recent_activity JSON;
BEGIN
  -- Get user basic data
  SELECT * INTO user_data
  FROM public.users 
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RETURN '{"error": "User not found"}'::JSON;
  END IF;

  -- Get today's usage by source
  SELECT 
    COALESCE(SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN source = 'extension' THEN 1 ELSE 0 END), 0)
  INTO website_today, extension_today
  FROM public.ai_generations
  WHERE user_id = user_uuid 
    AND success = true
    AND DATE(created_at) = CURRENT_DATE;

  -- Get this month's usage by source
  SELECT 
    COALESCE(SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN source = 'extension' THEN 1 ELSE 0 END), 0)
  INTO website_month, extension_month
  FROM public.ai_generations
  WHERE user_id = user_uuid 
    AND success = true
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

  -- Get total usage by source
  SELECT 
    COALESCE(SUM(CASE WHEN source = 'website' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN source = 'extension' THEN 1 ELSE 0 END), 0)
  INTO total_website, total_extension
  FROM public.ai_generations
  WHERE user_id = user_uuid AND success = true;

  -- Get device count
  SELECT COUNT(*) INTO device_count
  FROM public.user_devices
  WHERE user_id = user_uuid;

  -- Get recent activity (last 5 generations)
  SELECT json_agg(
    json_build_object(
      'id', id,
      'source', source,
      'generation_type', generation_type,
      'created_at', created_at,
      'success', success
    )
  ) INTO recent_activity
  FROM (
    SELECT id, source, generation_type, created_at, success
    FROM public.ai_generations
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 5
  ) recent;

  -- Return comprehensive stats
  RETURN json_build_object(
    'user_role', user_data.role,
    'daily_limit', user_data.daily_limit,
    'monthly_limit', user_data.monthly_limit,
    'device_limit', user_data.device_limit,
    'daily_used', user_data.daily_usage,
    'monthly_used', user_data.monthly_usage,
    'website_today', website_today,
    'extension_today', extension_today,
    'website_month', website_month,
    'extension_month', extension_month,
    'total_website', total_website,
    'total_extension', total_extension,
    'device_count', device_count,
    'is_unlimited', user_data.daily_limit = -1 AND user_data.monthly_limit = -1,
    'can_generate', public.can_user_generate(user_uuid),
    'recent_activity', COALESCE(recent_activity, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate extension authentication
CREATE OR REPLACE FUNCTION public.validate_extension_access(
  user_uuid UUID,
  device_fingerprint TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  device_exists BOOLEAN;
  user_active BOOLEAN;
BEGIN
  -- Check if user is active
  SELECT status = 'active' INTO user_active
  FROM public.users
  WHERE id = user_uuid;

  IF NOT user_active OR user_active IS NULL THEN
    RETURN false;
  END IF;

  -- Check if device is registered
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_devices
    WHERE user_id = user_uuid 
      AND device_fingerprint = device_fingerprint
  ) INTO device_exists;

  -- Update device activity if exists
  IF device_exists THEN
    UPDATE public.user_devices
    SET last_active = NOW()
    WHERE user_id = user_uuid AND device_fingerprint = device_fingerprint;
  END IF;

  RETURN device_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to get user limits for extension
CREATE OR REPLACE FUNCTION public.get_user_limits_for_extension(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_limits RECORD;
BEGIN
  SELECT 
    role,
    daily_limit,
    monthly_limit,
    device_limit,
    daily_usage,
    monthly_usage,
    status
  INTO user_limits
  FROM public.users
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RETURN '{"error": "User not found"}'::JSON;
  END IF;

  RETURN json_build_object(
    'role', user_limits.role,
    'daily_limit', user_limits.daily_limit,
    'monthly_limit', user_limits.monthly_limit,
    'device_limit', user_limits.device_limit,
    'daily_used', user_limits.daily_usage,
    'monthly_used', user_limits.monthly_usage,
    'daily_remaining', 
      CASE 
        WHEN user_limits.daily_limit = -1 THEN -1
        ELSE GREATEST(0, user_limits.daily_limit - user_limits.daily_usage)
      END,
    'monthly_remaining', 
      CASE 
        WHEN user_limits.monthly_limit = -1 THEN -1
        ELSE GREATEST(0, user_limits.monthly_limit - user_limits.monthly_usage)
      END,
    'is_unlimited', user_limits.daily_limit = -1 AND user_limits.monthly_limit = -1,
    'can_generate', public.can_user_generate(user_uuid),
    'status', user_limits.status
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log extension errors for debugging
CREATE OR REPLACE FUNCTION public.log_extension_error(
  user_uuid UUID,
  error_type TEXT,
  error_message TEXT,
  context_data JSON DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ai_generations (
    user_id,
    source,
    generation_type,
    success,
    error_message,
    created_at
  ) VALUES (
    user_uuid,
    'extension',
    'error_log',
    false,
    json_build_object(
      'error_type', error_type,
      'message', error_message,
      'context', context_data
    )::text,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on generation queries
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_source_date 
ON public.ai_generations(user_id, source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_success_date 
ON public.ai_generations(user_id, success, created_at DESC) 
WHERE success = true;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_ai_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_extension_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_limits_for_extension TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_extension_error TO authenticated;