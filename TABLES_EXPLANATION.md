# MailoReply AI - Database Tables Logic & Architecture

## 🏗️ Database Architecture Overview

The MailoReply AI database is designed with a multi-tenant architecture supporting individual users, companies, and enterprise features with integrated extension support.

## 📊 Core Tables Structure

### 1. **users** - User Management & Role-Based Access

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,                    -- Matches Supabase Auth user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'free', -- Determines access level
  company_id UUID REFERENCES companies(id),
  status user_status NOT NULL DEFAULT 'active',
  
  -- Usage Limits (Auto-set by role)
  daily_limit INTEGER NOT NULL DEFAULT 3,
  monthly_limit INTEGER NOT NULL DEFAULT 30,
  device_limit INTEGER NOT NULL DEFAULT 1,
  
  -- Current Usage (Reset daily/monthly)
  daily_usage INTEGER NOT NULL DEFAULT 0,
  monthly_usage INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  last_monthly_reset DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Role-Based Logic:**
- `free`: 3 emails/day, 30/month, 1 device
- `pro`: Unlimited daily, 100/month, 1 device  
- `pro_plus`: Unlimited everything, 2 devices
- `enterprise_user`: Unlimited everything, unlimited devices
- `enterprise_manager`: Full company management access
- `superuser`: System administration access

**Key Functions:**
```sql
-- Automatically updates limits when role changes
TRIGGER update_user_limits_trigger
-- Checks if user can generate based on current usage
FUNCTION can_user_generate(user_uuid UUID) RETURNS boolean
-- Increments usage after successful generation
FUNCTION increment_user_usage(user_uuid UUID)
```

### 2. **companies** - Enterprise Account Management

```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan plan_type NOT NULL DEFAULT 'enterprise',
  max_users INTEGER NOT NULL DEFAULT 50,
  current_users INTEGER NOT NULL DEFAULT 0,
  domain TEXT,                           -- For domain-based user assignment
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Enterprise Logic:**
- Companies can have multiple users
- Enterprise managers can invite/manage team members
- Company templates are shared across all company users
- Usage analytics are aggregated at company level

### 3. **templates** - Core Template Management

```sql
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,                          -- Optional email subject
  hotkey TEXT,                          -- Extension hotkey (e.g., "Ctrl+1")
  
  -- Extension & Organization Features
  tags TEXT[],                          -- Array for categorization
  approved_by UUID REFERENCES users(id), -- For company template approval
  approved_at TIMESTAMP WITH TIME ZONE,
  
  visibility TEXT NOT NULL DEFAULT 'private', -- 'private', 'company', 'pending_approval'
  usage_count INTEGER NOT NULL DEFAULT 0,     -- Tracks total usage
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Template Visibility Logic:**

1. **Private Templates** (`visibility = 'private'`)
   - Only visible to the creator
   - Used for personal templates
   - Synced to user's extension

2. **Company Templates** (`visibility = 'company'`)  
   - Visible to all company members
   - Must be approved by enterprise manager
   - Shared across all company users' extensions

3. **Pending Approval** (`visibility = 'pending_approval'`)
   - Submitted by enterprise users for company sharing
   - Only enterprise managers can approve/reject
   - Not visible in extensions until approved

**Key Functions:**
```sql
-- Increments usage count (called by both web and extension)
FUNCTION increment_template_usage(template_uuid UUID)
```

### 4. **ai_generations** - Usage Tracking (Web + Extension)

```sql
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Source Tracking
  source generation_source NOT NULL,      -- 'website' or 'extension'
  generation_type TEXT NOT NULL,          -- 'reply', 'email', 'template_use', 'text_expand'
  language TEXT NOT NULL,
  tone TEXT NOT NULL,
  intent TEXT,                           -- For reply generation
  
  -- Content Metrics
  input_length INTEGER,
  output_length INTEGER,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage Tracking Logic:**

1. **Website Usage** (`source = 'website'`)
   - AI email generation via N8N
   - Template usage from web interface
   - Analytics dashboard data

2. **Extension Usage** (`source = 'extension'`)
   - Template usage via hotkeys
   - Text expansion tracking
   - Automatic usage counting

**Key Functions:**
```sql
-- Tracks all extension usage and increments user usage
FUNCTION track_extension_usage(
  user_uuid UUID,
  action_type TEXT,
  template_id UUID DEFAULT NULL,
  content_length INTEGER DEFAULT NULL
)
```

### 5. **user_subscriptions** - Stripe Integration

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  price_id TEXT REFERENCES stripe_prices(id),
  product_id TEXT REFERENCES stripe_products(id),
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id) -- One active subscription per user
);
```

**Subscription Logic:**
- Automatically updates user role based on subscription status
- Handles trial periods and cancellations
- Synced via Stripe webhooks
- Affects user limits and extension access

**Key Functions:**
```sql
-- Automatically updates user role when subscription changes
TRIGGER update_user_role_from_subscription_trigger
FUNCTION update_user_role_from_subscription()
```

## 🔄 Data Flow Architecture

### 1. User Registration & Subscription Flow

```
User Signs Up → Supabase Auth → users table created
     ↓
User Subscribes → Stripe Checkout → Webhook → user_subscriptions table
     ↓
Subscription Active → Trigger → user role updated → limits updated
     ↓
Extension Syncs → New limits applied → Templates accessible
```

### 2. Template Management Flow

```
Website: Create Template → templates table → Real-time sync → Extension
     ↓
Extension: Use Template → track_extension_usage() → ai_generations + usage_count
     ↓
Website: Analytics → Query ai_generations → Display usage stats
```

### 3. Enterprise Workflow

```
Enterprise Manager → Create Company → companies table
     ↓
Invite Users → users.company_id set → Company templates visible
     ↓
User Creates Template → visibility = 'pending_approval'
     ↓
Manager Approves → visibility = 'company' → Available to all company users
```

## 🔐 Security & Access Control

### Row Level Security (RLS) Policies

**Users Table:**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Superusers can see all users
CREATE POLICY "Superusers can view all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superuser')
  );
```

**Templates Table:**
```sql
-- Users can manage their own templates
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

-- Users can view company templates
CREATE POLICY "Users can view company templates" ON templates
  FOR SELECT USING (
    company_id IS NOT NULL AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
    visibility = 'company'
  );
```

**AI Generations Table:**
```sql
-- Users can only see their own usage data
CREATE POLICY "Users can view own generations" ON ai_generations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create new generation records
CREATE POLICY "Users can create generations" ON ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 📈 Analytics & Reporting Logic

### Usage Analytics Queries

**Individual User Analytics:**
```sql
-- Get user's daily usage breakdown
SELECT 
  DATE(created_at) as date,
  source,
  generation_type,
  COUNT(*) as count
FROM ai_generations 
WHERE user_id = $1 
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), source, generation_type
ORDER BY date DESC;
```

**Company Analytics:**
```sql
-- Get company-wide usage statistics
SELECT 
  u.name,
  COUNT(ag.*) as total_generations,
  COUNT(CASE WHEN ag.source = 'extension' THEN 1 END) as extension_usage,
  COUNT(CASE WHEN ag.source = 'website' THEN 1 END) as website_usage
FROM users u
LEFT JOIN ai_generations ag ON u.id = ag.user_id
WHERE u.company_id = $1
  AND ag.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY total_generations DESC;
```

**Template Usage Analytics:**
```sql
-- Most popular templates
SELECT 
  t.title,
  t.usage_count,
  COUNT(ag.*) as recent_usage
FROM templates t
LEFT JOIN ai_generations ag ON ag.generation_type = 'template_use'
WHERE t.user_id = $1 
  AND ag.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.title, t.usage_count
ORDER BY t.usage_count DESC;
```

## 🚀 Performance Optimizations

### Database Indexes

```sql
-- Core performance indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_templates_company ON templates(company_id);
CREATE INDEX idx_templates_visibility ON templates(visibility);
CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created ON ai_generations(created_at);
CREATE INDEX idx_ai_generations_source ON ai_generations(source);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
```

### Automated Maintenance

```sql
-- Daily usage reset function (called by cron)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET daily_usage = 0, last_daily_reset = CURRENT_DATE
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Monthly usage reset function
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET monthly_usage = 0, last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE)
  WHERE last_monthly_reset < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;
```

## 🔄 Extension Integration Points

### 1. Template Synchronization

**Extension Query:**
```sql
-- Get all accessible templates for user
SELECT t.* 
FROM templates t
JOIN users u ON u.id = $1
WHERE 
  (t.user_id = u.id AND t.visibility = 'private')
  OR 
  (t.company_id = u.company_id AND t.visibility = 'company')
ORDER BY t.updated_at DESC;
```

### 2. Usage Tracking

**Extension Function Call:**
```sql
-- Track template usage from extension
SELECT track_extension_usage(
  $1,  -- user_id
  'template_use',
  $2,  -- template_id  
  $3   -- content_length
);
```

### 3. Real-time Updates

**Extension Subscription:**
```javascript
// Listen for template changes
supabase
  .channel('user_templates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'templates',
    filter: `user_id=eq.${userId}`
  }, handleTemplateChange)
  .subscribe();
```

## 📋 Data Consistency Rules

### 1. User Role Consistency
- User role automatically determines usage limits
- Subscription status automatically updates user role
- Role changes trigger limit recalculation

### 2. Usage Tracking Consistency
- All template usage (web + extension) increments usage_count
- User daily/monthly limits are enforced before any generation
- Usage resets happen automatically via database functions

### 3. Template Visibility Consistency
- Private templates only visible to creator
- Company templates require approval workflow
- Extension only syncs approved templates

### 4. Enterprise Data Isolation
- Company data isolated via RLS policies
- Enterprise managers can only manage their company
- Superusers have full system access

## 🎯 System Benefits

### For Users:
- Seamless sync between website and extension
- Role-based access with automatic limit management
- Real-time template updates across all devices

### For Enterprises:
- Centralized template management
- Usage analytics and reporting
- Team collaboration with approval workflows

### For System Administration:
- Automated subscription management
- Comprehensive usage tracking
- Scalable multi-tenant architecture

This database architecture provides a robust foundation for the MailoReply AI system, supporting both individual users and enterprise customers with seamless integration between the website and browser extension.
