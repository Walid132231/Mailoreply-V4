# 🗄️ Supabase Schema Deployment Instructions

## Quick Deployment Steps:

### 1. Access Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Login to your account
- Select your project: dfzspjqgvdzosrddqcje

### 2. Open SQL Editor
- In your project dashboard, click "SQL Editor" in the left sidebar
- Click "New Query" to create a new SQL script

### 3. Deploy Schema
- Copy the entire content from `/app/supabase_schema_clean.sql`
- Paste it into the SQL Editor
- Click "Run" to execute the schema

### 4. Verify Deployment
After running the schema, you should see these tables created:
- ✅ users
- ✅ companies  
- ✅ user_settings
- ✅ user_devices
- ✅ ai_generations
- ✅ templates

### 5. Expected Functions
These functions should also be created:
- ✅ can_user_generate
- ✅ increment_user_usage
- ✅ reset_daily_usage
- ✅ reset_monthly_usage
- ✅ update_user_limits

## 🔍 Verification Queries

After deployment, run these queries to verify:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check functions  
SELECT p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

## 🚨 Important Notes:

1. **Clean Deployment**: The schema will DROP existing tables, so this creates a fresh start
2. **Default Admin**: A default admin user will be created (you can change this later)
3. **Row Level Security**: RLS policies are configured for data security
4. **Usage Tracking**: Built-in functions for usage limits and tracking

## 🎯 After Schema Deployment:

Once you've deployed the schema successfully:
1. Your login/signup pages should work properly
2. The setup page should detect the configured database  
3. You can create additional administrator accounts
4. All authentication flows should function correctly

## 🆘 If You Need Help:

If you encounter any issues:
1. Check the SQL Editor for error messages
2. Make sure you copied the complete schema file
3. Verify your Supabase project permissions
4. Contact me if you need assistance with specific errors

The schema file is located at: `/app/supabase_schema_clean.sql`