# MailoReply AI - Stripe Integration Deployment Guide

This guide walks you through deploying MailoReply AI with complete Stripe payment integration for production.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Stripe account (business or personal)
- Netlify account for deployment

## 1. Stripe Configuration

### Step 1.1: Create Stripe Products and Prices

In your Stripe Dashboard (https://dashboard.stripe.com):

1. **Create Products:**
   - Go to Products → Add Product
   - Create the following products with these exact IDs:
     - `prod_pro` - Pro Plan
     - `prod_pro_plus` - Pro Plus Plan  
     - `prod_enterprise` - Enterprise Plan

2. **Create Prices:**
   For each product, create prices with these exact IDs:
   
   **Pro Plan:**
   - `price_pro_monthly` - $5.99/month
   - `price_pro_yearly` - $49.90/year (save $21.88)
   
   **Pro Plus Plan:**
   - `price_pro_plus_monthly` - $20.00/month
   - `price_pro_plus_yearly` - $200.00/year (save $40)
   
   **Enterprise Plan:**
   - `price_enterprise_custom` - Custom pricing (set to $0, handled separately)

### Step 1.2: Configure Webhooks

1. Go to Developers → Webhooks in Stripe Dashboard
2. Add endpoint: `https://your-domain.netlify.app/.netlify/functions/stripe-api/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (starts with `whsec_`)

### Step 1.3: Get API Keys

From Stripe Dashboard → Developers → API Keys:
- Copy **Publishable key** (starts with `pk_`)
- Copy **Secret key** (starts with `sk_`)

## 2. Supabase Database Setup

### Step 2.1: Run Base Schema

Execute the SQL in `supabase_schema_clean.sql` in your Supabase SQL editor.

### Step 2.2: Run Stripe Schema Extension

Execute the SQL in `supabase_stripe_schema.sql` in your Supabase SQL editor.

### Step 2.3: Update Product/Price IDs (Optional)

If you used different Stripe product/price IDs, update them in the database:

```sql
-- Update product IDs to match your Stripe products
UPDATE public.stripe_products SET id = 'your_actual_product_id' WHERE id = 'prod_pro';

-- Update price IDs to match your Stripe prices  
UPDATE public.stripe_prices SET id = 'your_actual_price_id' WHERE id = 'price_pro_monthly';
```

## 3. Environment Variables

### Step 3.1: Local Development (.env)

Create/update your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application URL
VITE_APP_URL=http://localhost:5173
```

### Step 3.2: Production Environment Variables

In your Netlify dashboard, add these environment variables:

**Site Settings → Environment Variables:**

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

VITE_APP_URL=https://your-domain.netlify.app
```

⚠️ **Important**: Use live keys (`pk_live_` and `sk_live_`) for production!

## 4. Code Configuration

### Step 4.1: Verify Stripe Config

Check `client/lib/stripe.ts` to ensure product/price IDs match your Stripe setup:

```typescript
export const STRIPE_CONFIG = {
  products: {
    PRO: 'prod_pro',  // Must match your Stripe product ID
    PRO_PLUS: 'prod_pro_plus',
    ENTERPRISE: 'prod_enterprise'
  },
  prices: {
    PRO_MONTHLY: 'price_pro_monthly',  // Must match your Stripe price ID
    PRO_YEARLY: 'price_pro_yearly',
    // ... etc
  }
};
```

### Step 4.2: Update Pricing Display (Optional)

If you changed prices, update `PRICE_DISPLAY` in `client/lib/stripe.ts`:

```typescript
export const PRICE_DISPLAY = {
  [STRIPE_CONFIG.prices.PRO_MONTHLY]: {
    amount: 599,  // Amount in cents
    displayAmount: '$5.99',
    // ... etc
  }
};
```

## 5. Deployment Steps

### Step 5.1: Build and Test Locally

```bash
# Install dependencies
npm install

# Test build
npm run build

# Test locally with env vars
npm run dev
```

### Step 5.2: Deploy to Netlify

#### Option A: Connect GitHub (Recommended)

1. Push your code to GitHub
2. Connect your repository in Netlify
3. Set environment variables (see Step 3.2)
4. Deploy automatically

#### Option B: Manual Deploy

```bash
# Build for production
npm run build

# Deploy using Netlify CLI
npx netlify deploy --prod --dir=dist
```

### Step 5.3: Configure Custom Domain (Optional)

1. In Netlify: Site Settings → Domain Management
2. Add your custom domain
3. Update `VITE_APP_URL` environment variable
4. Update Stripe webhook URL to use your domain

## 6. Post-Deployment Verification

### Step 6.1: Test Webhook Endpoint

Test your webhook endpoint:
```bash
curl -X POST https://your-domain.netlify.app/.netlify/functions/stripe-api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Step 6.2: Test Payment Flow

1. Visit your deployed site
2. Navigate to pricing section
3. Click "Upgrade to Pro" 
4. Complete test checkout (use Stripe test card: 4242 4242 4242 4242)
5. Verify subscription appears in dashboard
6. Check Supabase database for subscription record

### Step 6.3: Test Subscription Management

1. Log in to dashboard
2. Navigate to Subscription page
3. Test "Manage Billing" (opens Stripe Customer Portal)
4. Test cancellation and reactivation

## 7. Security Checklist

- ✅ All environment variables set correctly
- ✅ Using live Stripe keys in production
- ✅ Webhook endpoint secured with signing secret
- ✅ Supabase RLS policies enabled
- ✅ HTTPS enabled on custom domain
- ✅ Sensitive data not committed to git

## 8. Monitoring and Maintenance

### Stripe Dashboard Monitoring

Monitor these in your Stripe Dashboard:
- Successful payments
- Failed payments  
- Subscription changes
- Webhook delivery status

### Supabase Monitoring

Monitor your database:
- User subscription records
- Payment history
- Error logs

### Common Issues and Solutions

**Issue**: Webhook not receiving events
- **Solution**: Check webhook URL is correct and HTTPS
- **Check**: Webhook signing secret matches environment variable

**Issue**: Payments succeeding but user role not updating  
- **Solution**: Check webhook events are configured correctly
- **Check**: Database trigger `update_user_role_from_subscription_trigger` is active

**Issue**: Checkout session creation fails
- **Solution**: Verify Stripe secret key is correct  
- **Check**: Product and price IDs exist in Stripe

**Issue**: Customer portal not working
- **Solution**: User must have an existing subscription
- **Check**: Stripe customer ID exists in user_subscriptions table

## 9. Development vs Production

### Test Mode (Development)
- Use Stripe test keys (`pk_test_`, `sk_test_`)
- Test payments with Stripe test cards
- No real money transactions

### Live Mode (Production)  
- Use Stripe live keys (`pk_live_`, `sk_live_`)
- Real payment processing
- Monitor for actual revenue

## 10. Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

---

## Quick Start Checklist

For rapid deployment, follow this checklist:

- [ ] Create Stripe products and prices with correct IDs
- [ ] Set up webhook endpoint in Stripe
- [ ] Run both SQL schemas in Supabase
- [ ] Set all environment variables in Netlify
- [ ] Deploy application to Netlify
- [ ] Test complete payment flow
- [ ] Monitor Stripe webhook delivery
- [ ] Verify subscription management works

**Estimated Setup Time**: 30-45 minutes for experienced developers

---

## Need Help?

If you encounter issues during deployment:

1. Check browser console for client-side errors
2. Check Netlify function logs for server-side errors  
3. Check Stripe webhook delivery logs
4. Verify all environment variables are set correctly
5. Ensure database schema was applied successfully

For additional support, refer to the main README.md or create an issue in the repository.
