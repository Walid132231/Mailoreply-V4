# 🗄️ Supabase Database Deployment Guide

## 📋 **DEPLOYMENT SEQUENCE (IMPORTANT: Follow this exact order)**

### **Step 1: Deploy Core Schema** ✅
```sql
-- Deploy the main application schema first
-- File: supabase_schema_clean.sql
```
This creates all the core tables, types, and functions needed for the application.

### **Step 2: Deploy User Limits & Enhancement** ✅  
```sql
-- Deploy user limits and enhanced functionality  
-- File: complete_user_limits_update.sql
```
This adds proper user limits and usage tracking functions.

### **Step 3: Deploy Enhanced Template Management** ⚠️
```sql
-- Deploy enhanced template management
-- File: enhanced_template_management.sql
```
This adds template approval workflows and enhanced template functions.

### **Step 4: Deploy Stripe Integration** ⚠️ **USE FIXED VERSION**
```sql
-- Deploy Stripe billing integration (CONFLICT-FREE VERSION)
-- File: supabase_stripe_schema_fixed.sql
```
**⚠️ IMPORTANT: Use `supabase_stripe_schema_fixed.sql` instead of `supabase_stripe_schema.sql`**

### **Step 5: Deploy Enterprise Features** ✅
```sql
-- Deploy enterprise invitation system
-- File: enterprise_invitation_system.sql  
```
This adds enterprise user management and invitation features.

---

## 🛠️ **DEPLOYMENT INSTRUCTIONS**

### **Method 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each SQL file content **in the exact order above**
4. Run each script one by one
5. Verify no errors occur

### **Method 2: Command Line (Advanced)**
```bash
# Make sure you have supabase CLI installed
npm install -g supabase

# Login to your project
supabase login

# Link to your project  
supabase link --project-ref YOUR_PROJECT_REF

# Deploy schemas in order
supabase db push --file supabase_schema_clean.sql
supabase db push --file complete_user_limits_update.sql
supabase db push --file enhanced_template_management.sql
supabase db push --file supabase_stripe_schema_fixed.sql
supabase db push --file enterprise_invitation_system.sql
```

---

## ⚠️ **TROUBLESHOOTING FUNCTION CONFLICTS**

### **If you get "function name not unique" errors:**

1. **Clear conflicting functions first:**
```sql
-- Run this before deploying Stripe schema
DROP FUNCTION IF EXISTS public.increment_template_usage(UUID);
DROP FUNCTION IF EXISTS public.increment_template_usage(UUID, UUID);
```

2. **Use the fixed Stripe schema:**
   - Always use `supabase_stripe_schema_fixed.sql`  
   - Never use `supabase_stripe_schema.sql` (has conflicts)

3. **If you already ran the conflicting version:**
```sql
-- Clean up conflicts
DROP FUNCTION IF EXISTS public.increment_template_usage CASCADE;
DROP FUNCTION IF EXISTS public.track_extension_usage CASCADE;

-- Then run the fixed schema
-- (content of supabase_stripe_schema_fixed.sql)
```

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify these exist in your Supabase database:

### **Core Tables**
- [ ] `users` - User accounts and profiles
- [ ] `companies` - Company information
- [ ] `user_settings` - User preferences 
- [ ] `templates` - Email templates
- [ ] `ai_generations` - Usage tracking
- [ ] `user_devices` - Device management

### **Stripe Tables**
- [ ] `stripe_products` - Subscription products
- [ ] `stripe_prices` - Pricing tiers
- [ ] `user_subscriptions` - Active subscriptions
- [ ] `payment_history` - Payment records
- [ ] `stripe_customer_portal_sessions` - Portal sessions

### **Enterprise Tables**
- [ ] `enterprise_invitations` - Pending invites
- [ ] `template_approvals` - Template approval workflow

### **Functions**
- [ ] `can_user_generate()` - Usage limit checking
- [ ] `increment_user_usage()` - Usage tracking
- [ ] `update_user_role_from_subscription()` - Role management
- [ ] `get_user_subscription()` - Subscription info
- [ ] `track_extension_usage()` - Extension usage

### **Types**
- [ ] `user_role` - User role enum
- [ ] `plan_type` - Subscription plan enum  
- [ ] `subscription_status` - Stripe status enum

---

## 🚀 **POST-DEPLOYMENT SETUP**

### **1. Update Stripe Product IDs**
After creating products in your Stripe dashboard, update the database:

```sql
UPDATE public.stripe_products SET 
  id = 'prod_YOUR_ACTUAL_STRIPE_PRODUCT_ID'
WHERE id = 'prod_pro';

UPDATE public.stripe_prices SET
  id = 'price_YOUR_ACTUAL_STRIPE_PRICE_ID',
  product_id = 'prod_YOUR_ACTUAL_STRIPE_PRODUCT_ID'  
WHERE id = 'price_pro_monthly';
```

### **2. Configure RLS Policies**
Verify that Row Level Security is enabled and policies are active:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- View active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

### **3. Test Database Functions**
```sql
-- Test user role updates
SELECT public.update_user_limits();

-- Test subscription functions
SELECT * FROM public.get_user_subscription('YOUR_USER_UUID');

-- Test usage tracking
SELECT public.can_user_generate('YOUR_USER_UUID');
```

---

## 🔧 **ENVIRONMENT VARIABLES NEEDED**

Make sure these are set in your application:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_...
STRIPE_SECRET_KEY=sk_test_or_sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📞 **SUPPORT**

If you encounter any issues:

1. **Check the exact error message** from Supabase
2. **Verify deployment order** was followed correctly  
3. **Use the fixed schema files** (especially for Stripe integration)
4. **Check function conflicts** using the troubleshooting section above

**✅ Following this guide ensures a clean, conflict-free database deployment for your MailoReply AI application.**