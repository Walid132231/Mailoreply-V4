# MailoReply AI - Backend Integration Requirements

## ✅ CURRENT STATUS

The frontend application is **100% complete** with:
- ✅ Complete Stripe payment integration
- ✅ Full template management system with hotkey support
- ✅ Extension-ready database schema
- ✅ User management and role-based access
- ✅ All UI components and pages working
- ✅ Build successful and deployment-ready

## 🔧 WHAT YOU NEED TO SET UP

### 1. Database Setup (Supabase)

#### Required SQL Schemas
Run these files in your Supabase SQL editor:

1. **`supabase_schema_clean.sql`** - Core database structure
2. **`supabase_stripe_schema.sql`** - Payment and subscription tables + extension tracking

#### Key Tables Created
- `users` - User accounts with role-based limits
- `templates` - Email templates with hotkey support
- `user_subscriptions` - Stripe subscription tracking  
- `ai_generations` - Usage tracking (website + extension)
- `payment_history` - Payment records
- `companies` - Enterprise account management

#### Extension-Ready Functions
- `track_extension_usage()` - Tracks extension template usage
- `increment_template_usage()` - Updates template usage counts
- `can_user_generate()` - Checks user limits
- `increment_user_usage()` - Updates usage counters

### 2. Stripe Configuration

#### Products & Prices to Create
In your Stripe Dashboard, create these exact IDs:

**Products:**
- `prod_pro` - Pro Plan ($5.99/month)
- `prod_pro_plus` - Pro Plus Plan ($20/month)
- `prod_enterprise` - Enterprise Plan (custom)

**Prices:**
- `price_pro_monthly` - $5.99/month
- `price_pro_yearly` - $49.90/year  
- `price_pro_plus_monthly` - $20/month
- `price_pro_plus_yearly` - $200/year

#### Webhook Setup
- Endpoint: `https://yourdomain.com/.netlify/functions/stripe-api/webhook`
- Events: `customer.subscription.*`, `invoice.payment_*`

### 3. N8N API Integration

You mentioned you'll handle N8N logic. The application is ready to receive these APIs:

#### Email Generation Endpoint Needed
```typescript
POST /api/n8n/generate-email
{
  "prompt": "string",
  "tone": "professional|casual|friendly", 
  "language": "string",
  "userId": "uuid"
}

Response: {
  "subject": "string",
  "body": "string", 
  "success": boolean
}
```

#### Reply Generation Endpoint Needed  
```typescript
POST /api/n8n/generate-reply
{
  "originalEmail": "string",
  "intent": "accept|decline|request_info",
  "tone": "string",
  "userId": "uuid"
}

Response: {
  "body": "string",
  "success": boolean
}
```

### 4. Environment Variables

#### Required for Production
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe  
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
VITE_APP_URL=https://yourdomain.com

# N8N (when you add it)
N8N_API_URL=your_n8n_endpoint
N8N_API_KEY=your_n8n_key
```

## 📋 EXTENSION INTEGRATION

### Database Functions Ready
The extension can immediately use these Supabase functions:

```sql
-- Track extension usage
SELECT track_extension_usage(
  'user-uuid', 
  'template_use', 
  'template-uuid', 
  content_length
);

-- Get user templates 
SELECT * FROM templates 
WHERE user_id = 'user-uuid' 
   OR (company_id = 'company-uuid' AND visibility = 'company');

-- Check if user can generate
SELECT can_user_generate('user-uuid');
```

### Template Management Ready
- ✅ CRUD operations for templates
- ✅ Hotkey assignment and editing
- ✅ Private/company visibility
- ✅ Usage tracking
- ✅ Extension can directly query Supabase

## 🚀 DEPLOYMENT CHECKLIST

Once you configure the backend:

### Phase 1: Core Setup (30 minutes)
- [ ] Apply database schemas to Supabase
- [ ] Configure Stripe products and webhooks  
- [ ] Set environment variables in Netlify
- [ ] Deploy frontend (already built)

### Phase 2: N8N Integration (Your timeline)
- [ ] Connect N8N email generation APIs
- [ ] Test email generation flow
- [ ] Verify usage tracking

### Phase 3: Extension Connection (5 minutes)
- [ ] Update extension Supabase URL
- [ ] Test template synchronization
- [ ] Verify hotkey functionality

## ✅ WHAT'S ALREADY WORKING

### Frontend Features
- Complete template management interface
- Stripe checkout and subscription management
- User dashboard with role-based access
- Payment history and billing portal
- Enterprise team management
- All navigation and authentication

### Backend Functions  
- Automatic user role updates from Stripe
- Usage limit enforcement
- Template sharing and approval workflows
- Extension usage tracking
- Payment webhook processing

## 🎯 FINAL CONFIRMATION

**Question: "If I add the APIs for Supabase, Stripe and N8N we should be good to go?"**

**Answer: YES!** 

Once you:
1. ✅ Apply the database schemas to Supabase
2. ✅ Configure Stripe products/webhooks  
3. ✅ Add N8N email generation endpoints
4. ✅ Set environment variables

The entire application will be **fully functional** including:
- ✅ User registration and payments
- ✅ Template management from website
- ✅ Extension integration with templates
- ✅ Email generation via N8N
- ✅ Usage tracking and limits
- ✅ Enterprise features

The website is specifically designed to **only manage templates** as you requested, with the extension handling the actual email generation using those templates.
