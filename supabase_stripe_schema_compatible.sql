-- MailoReply AI - Stripe Integration Schema (FULLY COMPATIBLE VERSION)
-- Works with all PostgreSQL versions including Supabase
-- Safe to run multiple times

-- Clean up any existing conflicts first
DROP FUNCTION IF EXISTS public.increment_template_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_template_usage(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.track_extension_usage CASCADE;

-- Create subscription_status type safely
DO $$ 
BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'incomplete',
    'incomplete_expired', 
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create price_interval type safely
DO $$ 
BEGIN
  CREATE TYPE price_interval AS ENUM (
    'month',
    'year'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stripe products table
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type plan_type NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe prices table
CREATE TABLE IF NOT EXISTS public.stripe_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.stripe_products(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type price_interval NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  price_id TEXT REFERENCES public.stripe_prices(id),
  product_id TEXT REFERENCES public.stripe_products(id),
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Payment history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer portal sessions table
CREATE TABLE IF NOT EXISTS public.stripe_customer_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  return_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customer_portal_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Users can view own portal sessions" ON public.stripe_customer_portal_sessions;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.stripe_products;
DROP POLICY IF EXISTS "Anyone can view active prices" ON public.stripe_prices;
DROP POLICY IF EXISTS "Superusers can manage stripe products" ON public.stripe_products;
DROP POLICY IF EXISTS "Superusers can manage stripe prices" ON public.stripe_prices;
DROP POLICY IF EXISTS "Superusers can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Superusers can view all payments" ON public.payment_history;

-- Create RLS policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portal sessions" ON public.stripe_customer_portal_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active products" ON public.stripe_products
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active prices" ON public.stripe_prices
  FOR SELECT USING (active = true);

CREATE POLICY "Superusers can manage stripe products" ON public.stripe_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

CREATE POLICY "Superusers can manage stripe prices" ON public.stripe_prices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

CREATE POLICY "Superusers can view all subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

CREATE POLICY "Superusers can view all payments" ON public.payment_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superuser')
  );

-- Function to update user role based on subscription
CREATE OR REPLACE FUNCTION public.update_user_role_from_subscription()
RETURNS TRIGGER AS $$
DECLARE
  target_role user_role;
  target_plan plan_type;
BEGIN
  IF NEW.status IN ('active', 'trialing') THEN
    SELECT sp.plan_type INTO target_plan
    FROM public.stripe_products sp
    WHERE sp.id = NEW.product_id;
    
    CASE target_plan
      WHEN 'pro' THEN target_role := 'pro';
      WHEN 'pro_plus' THEN target_role := 'pro_plus';
      WHEN 'enterprise' THEN target_role := 'enterprise_user';
      ELSE target_role := 'free';
    END CASE;
  ELSE
    target_role := 'free';
  END IF;
  
  UPDATE public.users 
  SET role = target_role, updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_user_role_from_subscription_trigger ON public.user_subscriptions;
CREATE TRIGGER update_user_role_from_subscription_trigger
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_from_subscription();

-- Function to get user subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  stripe_subscription_id TEXT,
  status subscription_status,
  plan_name TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.stripe_subscription_id,
    us.status,
    sp.name,
    us.current_period_end,
    us.cancel_at_period_end
  FROM public.user_subscriptions us
  JOIN public.stripe_products sp ON us.product_id = sp.id
  WHERE us.user_id = user_uuid
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Extension usage tracking function
CREATE OR REPLACE FUNCTION public.track_extension_usage(
  user_uuid UUID,
  action_type TEXT,
  template_id UUID DEFAULT NULL,
  content_length INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ai_generations (
    user_id,
    company_id,
    source,
    generation_type,
    language,
    tone,
    input_length,
    output_length,
    encrypted,
    success
  )
  SELECT
    user_uuid,
    u.company_id,
    'extension'::generation_source,
    action_type,
    'English',
    'Professional',
    0,
    COALESCE(content_length, 0),
    false,
    true
  FROM public.users u
  WHERE u.id = user_uuid;

  IF template_id IS NOT NULL THEN
    UPDATE public.templates
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = template_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default products
INSERT INTO public.stripe_products (id, name, description, plan_type, active) VALUES
  ('prod_free', 'Free Plan', 'Basic email generation with limited usage', 'free', true),
  ('prod_pro', 'Pro Plan', 'Unlimited daily emails with premium features', 'pro', true),
  ('prod_pro_plus', 'Pro Plus Plan', 'Unlimited everything with advanced features', 'pro_plus', true),
  ('prod_enterprise', 'Enterprise Plan', 'Custom solution for teams and organizations', 'enterprise', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_type = EXCLUDED.plan_type,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert default prices
INSERT INTO public.stripe_prices (id, product_id, amount, currency, interval_type, interval_count, active) VALUES
  ('price_pro_monthly', 'prod_pro', 599, 'usd', 'month', 1, true),
  ('price_pro_yearly', 'prod_pro', 4990, 'usd', 'year', 1, true),
  ('price_pro_plus_monthly', 'prod_pro_plus', 2000, 'usd', 'month', 1, true),
  ('price_pro_plus_yearly', 'prod_pro_plus', 20000, 'usd', 'year', 1, true),
  ('price_enterprise_custom', 'prod_enterprise', 0, 'usd', 'month', 1, false)
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  interval_type = EXCLUDED.interval_type,
  interval_count = EXCLUDED.interval_count,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Create indexes safely (some PostgreSQL versions don't support IF NOT EXISTS for indexes)
DO $$
BEGIN
  CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$
BEGIN
  CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$
BEGIN
  CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$
BEGIN
  CREATE INDEX idx_payment_history_user ON public.payment_history(user_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$
BEGIN
  CREATE INDEX idx_payment_history_subscription ON public.payment_history(subscription_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$
BEGIN
  CREATE INDEX idx_stripe_prices_product ON public.stripe_prices(product_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Success message
SELECT '✅ Stripe integration deployed successfully!' as message,
       '🎯 Tables created: stripe_products, stripe_prices, user_subscriptions, payment_history' as tables,
       '⚡ Functions created: role updates, subscription tracking, extension usage' as functions,
       '🔒 RLS policies enabled for secure data access' as security;