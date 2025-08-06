# 🗄️ DATABASE DEPLOYMENT - FINAL FILES

## 📋 **DEPLOYMENT FILES (Deploy in this exact order)**

### **✅ Step 1: Core Database Schema**
```
File: supabase_schema_clean.sql
Purpose: Creates all core tables, types, and basic functions
Status: ✅ Required Foundation
```

### **✅ Step 2: User Limits & Usage Tracking** 
```
File: complete_user_limits_update.sql  
Purpose: Adds user limits, usage tracking, and limit enforcement
Status: ✅ Required for Usage Management
```

### **✅ Step 3: Enhanced Template Management**
```
File: enhanced_template_management.sql
Purpose: Template approval workflow, private templates, company templates
Status: ✅ Required for Template Features
```

### **✅ Step 4: Stripe Integration**
```
File: supabase_stripe_schema_compatible.sql
Purpose: Billing, subscriptions, payments, automatic role upgrades
Status: ✅ Required for Billing (TESTED & WORKING)
```

### **✅ Step 5: Enterprise Features**
```
File: enterprise_invitation_system.sql
Purpose: Enterprise invitations, bulk user import, company management
Status: ✅ Required for Enterprise Features
```

---

## 🚀 **DEPLOYMENT INSTRUCTIONS**

### **Method: Supabase Dashboard**
1. Go to **Supabase Project Dashboard**
2. Navigate to **SQL Editor**  
3. **Copy and paste each file content** in the exact order above
4. **Run each script one by one**
5. **Wait for success message** before proceeding to next file

### **Expected Results:**
- **Step 1**: Core tables and user management ✅
- **Step 2**: Usage limits and tracking functions ✅
- **Step 3**: Template management with workflows ✅
- **Step 4**: `✅ Stripe integration deployed successfully!` ✅
- **Step 5**: Enterprise invitation system ✅

---

## 🧹 **CLEANED UP FILES**

**✅ KEPT (Production Files):**
- `supabase_schema_clean.sql`
- `complete_user_limits_update.sql`  
- `enhanced_template_management.sql`
- `supabase_stripe_schema_compatible.sql`
- `enterprise_invitation_system.sql`

**❌ DELETED (Outdated/Conflicting):**
- `supabase_stripe_schema.sql` (had function conflicts)
- `supabase_stripe_schema_fixed.sql` (system table issues)
- `supabase_stripe_schema_final.sql` (system table issues)
- `supabase_stripe_schema_minimal.sql` (CREATE TYPE IF NOT EXISTS issues)
- `corrected_user_limits.sql` (replaced by complete version)
- `user_limits_verification.sql` (verification only, not needed)
- `enhanced_extension_tracking.sql` (integrated into other files)

---

## ✅ **VERIFICATION CHECKLIST**

After deploying all 5 files, verify these exist in Supabase:

### **Core Tables:**
- [ ] `users` - User accounts and authentication
- [ ] `companies` - Company/organization management
- [ ] `user_settings` - User preferences and settings
- [ ] `templates` - Email templates with approval workflow
- [ ] `ai_generations` - Usage tracking and analytics
- [ ] `user_devices` - Device management and limits

### **Stripe Tables:**
- [ ] `stripe_products` - Subscription products/plans
- [ ] `stripe_prices` - Pricing tiers (monthly/yearly)
- [ ] `user_subscriptions` - Active user subscriptions
- [ ] `payment_history` - Payment records and invoices
- [ ] `stripe_customer_portal_sessions` - Customer portal access

### **Enterprise Tables:**
- [ ] `enterprise_invitations` - Pending enterprise invites
- [ ] `template_approvals` - Template approval workflow

### **Key Functions:**
- [ ] `can_user_generate()` - Check if user can generate content
- [ ] `increment_user_usage()` - Track usage against limits
- [ ] `update_user_role_from_subscription()` - Auto role updates on payment
- [ ] `get_user_subscription()` - Get current subscription info

---

## 🎯 **NEXT STEPS AFTER DATABASE DEPLOYMENT**

1. **Set Environment Variables:**
   - `VITE_SUPABASE_URL` 
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Configure Stripe:**
   - Update product IDs in `stripe_products` table
   - Update price IDs in `stripe_prices` table
   - Set webhook endpoints

3. **Set up N8N Integration:**
   - Configure AI generation webhooks
   - Set authentication tokens

4. **Configure Google OAuth:**
   - Enable Google provider in Supabase Auth
   - Set up Google Cloud Console OAuth

**🚀 Your database is now clean and deployment-ready with only the essential, tested SQL files!**