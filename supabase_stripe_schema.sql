-- MailoReply AI - Stripe Integration Schema Extension
-- Adds subscription management and payment tracking to the existing clean schema

-- Stripe subscription statuses
CREATE TYPE subscription_status AS ENUM (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid'
);

-- Stripe price intervals
CREATE TYPE price_interval AS ENUM (
  'month',
  'year'
);

-- Stripe products table (corresponds to Stripe products)
CREATE TABLE public.stripe_products (
  id TEXT PRIMARY KEY, -- Stripe product ID
  name TEXT NOT NULL,
  description TEXT,
  plan_type plan_type NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe prices table (corresponds to Stripe prices)
CREATE TABLE public.stripe_prices (
  id TEXT PRIMARY KEY, -- Stripe price ID
  product_id TEXT NOT NULL REFERENCES public.stripe_products(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type price_interval NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table (tracks Stripe subscriptions)
CREATE TABLE public.user_subscriptions (
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
  
  UNIQUE(user_id) -- One active subscription per user
);

-- Payment history table (tracks successful payments)
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, failed, etc.
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer portal sessions (for subscription management)
CREATE TABLE public.stripe_customer_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL,
  return_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customer_portal_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription data
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portal sessions" ON public.stripe_customer_portal_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view active products and prices (public pricing)
CREATE POLICY "Anyone can view active products" ON public.stripe_products
  FOR SELECT USING (active = true);

CREATE POLICY "Anyone can view active prices" ON public.stripe_prices
  FOR SELECT USING (active = true);

-- Superusers can manage everything
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
  -- Determine role based on subscription status and product
  IF NEW.status IN ('active', 'trialing') THEN
    -- Get the plan type from the product
    SELECT sp.plan_type INTO target_plan
    FROM public.stripe_products sp
    WHERE sp.id = NEW.product_id;
    
    -- Map plan type to user role
    CASE target_plan
      WHEN 'pro' THEN target_role := 'pro';
      WHEN 'pro_plus' THEN target_role := 'pro_plus';
      WHEN 'enterprise' THEN target_role := 'enterprise_user';
      ELSE target_role := 'free';
    END CASE;
  ELSE
    -- Subscription is not active, revert to free
    target_role := 'free';
  END IF;
  
  -- Update user role
  UPDATE public.users 
  SET role = target_role, updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user role when subscription changes
CREATE TRIGGER update_user_role_from_subscription_trigger
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_from_subscription();

-- Function to get user's current subscription
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

-- Insert default Stripe products (these should match your Stripe dashboard)
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

-- Insert default Stripe prices (these should match your Stripe dashboard)
-- Note: Replace these with your actual Stripe price IDs after creating them in Stripe
INSERT INTO public.stripe_prices (id, product_id, amount, currency, interval_type, interval_count, active) VALUES
  -- Pro Plan Prices
  ('price_pro_monthly', 'prod_pro', 599, 'usd', 'month', 1, true),
  ('price_pro_yearly', 'prod_pro', 4990, 'usd', 'year', 1, true), -- $49.90/year ($4.99/month * 10 months)
  
  -- Pro Plus Plan Prices
  ('price_pro_plus_monthly', 'prod_pro_plus', 2000, 'usd', 'month', 1, true),
  ('price_pro_plus_yearly', 'prod_pro_plus', 20000, 'usd', 'year', 1, true), -- $200/year ($16.67/month * 12 months)
  
  -- Enterprise is custom pricing, handled separately
  ('price_enterprise_custom', 'prod_enterprise', 0, 'usd', 'month', 1, false)
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  interval_type = EXCLUDED.interval_type,
  interval_count = EXCLUDED.interval_count,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_payment_history_user ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_subscription ON public.payment_history(subscription_id);
CREATE INDEX idx_stripe_prices_product ON public.stripe_prices(product_id);

-- Extension usage tracking function
CREATE OR REPLACE FUNCTION public.track_extension_usage(
  user_uuid UUID,
  action_type TEXT,
  template_id UUID DEFAULT NULL,
  content_length INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert into ai_generations table to track extension usage
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
    action_type, -- 'template_use', 'text_expand', etc.
    'English', -- Default, can be enhanced later
    'Professional', -- Default, can be enhanced later
    0, -- Input length for template usage
    COALESCE(content_length, 0),
    false, -- Templates are not encrypted by default
    true
  FROM public.users u
  WHERE u.id = user_uuid;

  -- If it's a template usage, increment the template usage count
  IF template_id IS NOT NULL THEN
    PERFORM public.increment_template_usage(template_id);
  END IF;

  -- Increment user usage counters
  PERFORM public.increment_user_usage(user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to increment template usage (for extension and web)
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.templates
  SET
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.stripe_products IS 'Stripe products corresponding to subscription plans';
COMMENT ON TABLE public.stripe_prices IS 'Stripe prices for different billing intervals';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription data synced from Stripe';
COMMENT ON TABLE public.payment_history IS 'History of successful payments and invoices';
COMMENT ON FUNCTION public.update_user_role_from_subscription IS 'Automatically updates user role based on subscription status';
COMMENT ON FUNCTION public.get_user_subscription IS 'Gets current subscription details for a user';
COMMENT ON FUNCTION public.track_extension_usage IS 'Tracks usage from browser extension including template usage and text expansion';
COMMENT ON FUNCTION public.increment_template_usage IS 'Increments template usage count for both web and extension usage';
