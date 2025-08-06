-- MailoReply AI - Clean Database Schema
-- This replaces the old schema with a minimal, production-ready structure

-- Drop all existing tables (clean slate)
DROP TABLE IF EXISTS public.ai_generations CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.user_devices CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS generation_source CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM (
  'superuser',
  'enterprise_manager', 
  'enterprise_user',
  'pro_plus',
  'pro',
  'free'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'suspended'
);

CREATE TYPE plan_type AS ENUM (
  'free',
  'pro', 
  'pro_plus',
  'enterprise'
);

CREATE TYPE generation_source AS ENUM (
  'website',
  'extension'
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan plan_type NOT NULL DEFAULT 'enterprise',
  max_users INTEGER NOT NULL DEFAULT 50,
  current_users INTEGER NOT NULL DEFAULT 0,
  domain TEXT,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (core user information)
CREATE TABLE public.users (
  id UUID PRIMARY KEY, -- This will match Supabase Auth user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'free',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'active',
  
  -- Usage limits based on role
  daily_limit INTEGER NOT NULL DEFAULT 3, -- 3 for free, unlimited for others
  monthly_limit INTEGER NOT NULL DEFAULT 30, -- 30 for free, 100 for pro, unlimited for others
  device_limit INTEGER NOT NULL DEFAULT 1, -- 1 for most, 2 for pro_plus, unlimited for enterprise
  
  -- Current usage (resets daily/monthly)
  daily_usage INTEGER NOT NULL DEFAULT 0,
  monthly_usage INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  last_monthly_reset DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Encryption settings
  always_encrypt BOOLEAN NOT NULL DEFAULT false,
  encryption_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- AI preferences
  default_language TEXT NOT NULL DEFAULT 'English',
  default_tone TEXT NOT NULL DEFAULT 'Professional',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User devices table (track logged-in devices)
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL, -- Browser/device fingerprint
  device_name TEXT, -- Optional user-friendly name
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, device_fingerprint)
);

-- AI generations tracking (both website and extension)
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Generation details
  source generation_source NOT NULL,
  generation_type TEXT NOT NULL, -- 'reply' or 'email'
  language TEXT NOT NULL,
  tone TEXT NOT NULL,
  intent TEXT, -- Only for replies
  
  -- Content tracking
  input_length INTEGER,
  output_length INTEGER,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table (enhanced for extension integration)
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  hotkey TEXT,

  -- Extension-specific fields
  tags TEXT[], -- Array of tags for better organization
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- For company templates
  approved_at TIMESTAMP WITH TIME ZONE,

  visibility TEXT NOT NULL DEFAULT 'private', -- 'private', 'company', 'pending_approval'
  usage_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Device policies
CREATE POLICY "Users can manage own devices" ON public.user_devices
  FOR ALL USING (auth.uid() = user_id);

-- AI generations policies
CREATE POLICY "Users can view own generations" ON public.ai_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create generations" ON public.ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can manage own templates" ON public.templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view company templates" ON public.templates
  FOR SELECT USING (
    company_id IS NOT NULL AND 
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    visibility = 'company'
  );

-- Company policies (enterprise managers can view/edit their company)
CREATE POLICY "Enterprise managers can view company" ON public.companies
  FOR SELECT USING (
    id = (SELECT company_id FROM public.users WHERE id = auth.uid() AND role = 'enterprise_manager')
  );

-- Superusers can see everything
CREATE POLICY "Superusers can view all users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

CREATE POLICY "Superusers can view all companies" ON public.companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

-- Functions for usage tracking
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET daily_usage = 0, last_daily_reset = CURRENT_DATE
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET monthly_usage = 0, last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE)
  WHERE last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can generate (respects limits)
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
  
  -- Unlimited users (pro_plus, enterprise roles)
  IF user_record.role IN ('pro_plus', 'enterprise_manager', 'enterprise_user', 'superuser') THEN
    RETURN true;
  END IF;
  
  -- Check limits for free and pro users
  IF user_record.daily_limit > 0 AND user_record.daily_usage >= user_record.daily_limit THEN
    RETURN false;
  END IF;
  
  IF user_record.monthly_limit > 0 AND user_record.monthly_usage >= user_record.monthly_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage after successful generation
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Reset counters if needed
  PERFORM public.reset_daily_usage();
  PERFORM public.reset_monthly_usage();
  
  -- Increment usage for users with limits
  UPDATE public.users 
  SET 
    daily_usage = CASE 
      WHEN daily_limit > 0 THEN daily_usage + 1 
      ELSE daily_usage 
    END,
    monthly_usage = CASE 
      WHEN monthly_limit > 0 THEN monthly_usage + 1 
      ELSE monthly_usage 
    END,
    updated_at = NOW()
  WHERE id = user_uuid 
    AND role IN ('free', 'pro'); -- Only increment for limited users
END;
$$ LANGUAGE plpgsql;

-- Function to set user limits based on role
CREATE OR REPLACE FUNCTION public.update_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits based on role
  CASE NEW.role
    WHEN 'free' THEN
      NEW.daily_limit := 3;
      NEW.monthly_limit := 30;
      NEW.device_limit := 1;
    WHEN 'pro' THEN
      NEW.daily_limit := -1; -- unlimited daily
      NEW.monthly_limit := 100;
      NEW.device_limit := 1;
    WHEN 'pro_plus' THEN
      NEW.daily_limit := -1; -- unlimited
      NEW.monthly_limit := -1; -- unlimited
      NEW.device_limit := 2;
    ELSE -- enterprise roles and superuser
      NEW.daily_limit := -1; -- unlimited
      NEW.monthly_limit := -1; -- unlimited
      NEW.device_limit := -1; -- unlimited
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update limits when role changes
CREATE TRIGGER update_user_limits_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_limits();

-- Create default superuser (can be customized during setup)
INSERT INTO public.users (
  id, email, name, role, status,
  daily_limit, monthly_limit, device_limit,
  daily_usage, monthly_usage
) VALUES (
  gen_random_uuid(),
  'admin@mailoreply.ai',
  'System Administrator', 
  'superuser',
  'active',
  -1, -1, -1, -- unlimited limits
  0, 0 -- zero usage
) ON CONFLICT (email) DO NOTHING;

-- Insert default settings for superuser
INSERT INTO public.user_settings (user_id, always_encrypt, default_language, default_tone)
SELECT id, false, 'English', 'Professional'
FROM public.users 
WHERE email = 'admin@mailoreply.ai'
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_company ON public.users(company_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_ai_generations_user ON public.ai_generations(user_id);
CREATE INDEX idx_ai_generations_created ON public.ai_generations(created_at);
CREATE INDEX idx_user_devices_user ON public.user_devices(user_id);
CREATE INDEX idx_templates_user ON public.templates(user_id);
CREATE INDEX idx_templates_company ON public.templates(company_id);

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Core user accounts with role-based limits and usage tracking';
COMMENT ON TABLE public.companies IS 'Enterprise companies with their own plans and user limits';
COMMENT ON TABLE public.user_settings IS 'User preferences including encryption and AI defaults';
COMMENT ON TABLE public.user_devices IS 'Tracking logged-in devices per user for device limits';
COMMENT ON TABLE public.ai_generations IS 'All AI generation requests from website and extension';
COMMENT ON TABLE public.templates IS 'User and company email templates';

COMMENT ON FUNCTION public.can_user_generate IS 'Checks if user can generate based on daily/monthly limits';
COMMENT ON FUNCTION public.increment_user_usage IS 'Increments usage counters after successful generation';
