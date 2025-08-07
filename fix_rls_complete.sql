-- ============================================================================
-- SUPABASE RLS POLICY FIX - Run this in Supabase SQL Editor
-- ============================================================================
-- This script fixes the "infinite recursion detected in policy" errors
-- by removing problematic policies and creating simple, non-recursive ones.

-- Step 1: Clean up existing problematic policies on users table
-- ============================================================================

-- Temporarily disable RLS to allow cleanup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table (these are causing recursion)
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;  
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_own_data_policy" ON users;
DROP POLICY IF EXISTS "select_own_user_data" ON users;
DROP POLICY IF EXISTS "update_own_user_data" ON users;
DROP POLICY IF EXISTS "insert_own_user_data" ON users;
DROP POLICY IF EXISTS "delete_own_user_data" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "enable_read_access_for_users" ON users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users_only" ON users;
DROP POLICY IF EXISTS "enable_update_for_users_based_on_user_id" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create simple, non-recursive RLS policies for users
-- ============================================================================

-- Allow users to read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to insert their own data (for signup)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Step 3: Fix user_settings table policies
-- ============================================================================

ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_settings_policy" ON user_settings;
DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
DROP POLICY IF EXISTS "update_own_settings" ON user_settings;  
DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
DROP POLICY IF EXISTS "settings_select_own" ON user_settings;
DROP POLICY IF EXISTS "settings_insert_own" ON user_settings;
DROP POLICY IF EXISTS "settings_update_own" ON user_settings;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create simple policies for user_settings
CREATE POLICY "user_settings_read_own" ON user_settings
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Step 4: Fix user_devices table policies  
-- ============================================================================

ALTER TABLE user_devices DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_devices_policy" ON user_devices;
DROP POLICY IF EXISTS "select_own_devices" ON user_devices;
DROP POLICY IF EXISTS "insert_own_devices" ON user_devices;
DROP POLICY IF EXISTS "update_own_devices" ON user_devices;
DROP POLICY IF EXISTS "delete_own_devices" ON user_devices;
DROP POLICY IF EXISTS "devices_select_own" ON user_devices;
DROP POLICY IF EXISTS "devices_insert_own" ON user_devices;
DROP POLICY IF EXISTS "devices_update_own" ON user_devices;

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Create simple policies for user_devices
CREATE POLICY "user_devices_read_own" ON user_devices
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "user_devices_insert_own" ON user_devices
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_devices_update_own" ON user_devices
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Step 5: Fix templates table policies (if needed)
-- ============================================================================

-- Only proceed if templates table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'templates') THEN
    
    ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "templates_policy" ON templates;
    DROP POLICY IF EXISTS "select_own_templates" ON templates;
    DROP POLICY IF EXISTS "insert_own_templates" ON templates;
    DROP POLICY IF EXISTS "update_own_templates" ON templates;
    DROP POLICY IF EXISTS "delete_own_templates" ON templates;
    
    ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
    
    -- Create simple policies for templates
    CREATE POLICY "templates_read_own" ON templates
      FOR SELECT 
      USING (auth.uid() = user_id OR visibility = 'public');

    CREATE POLICY "templates_insert_own" ON templates
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "templates_update_own" ON templates
      FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "templates_delete_own" ON templates
      FOR DELETE 
      USING (auth.uid() = user_id);
      
  END IF;
END $$;

-- Step 6: Fix ai_generations table policies (if needed)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_generations') THEN
    
    ALTER TABLE ai_generations DISABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "ai_generations_policy" ON ai_generations;
    DROP POLICY IF EXISTS "select_own_generations" ON ai_generations;
    DROP POLICY IF EXISTS "insert_own_generations" ON ai_generations;
    
    ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
    
    -- Create simple policies
    CREATE POLICY "ai_generations_read_own" ON ai_generations
      FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "ai_generations_insert_own" ON ai_generations
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
  END IF;
END $$;

-- Step 7: Fix companies table policies (if needed)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    
    ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "companies_policy" ON companies;
    DROP POLICY IF EXISTS "select_own_company" ON companies;
    DROP POLICY IF EXISTS "update_own_company" ON companies;
    
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    
    -- Create simple policies - users can read companies they belong to
    CREATE POLICY "companies_read_members" ON companies
      FOR SELECT 
      USING (
        id IN (
          SELECT company_id 
          FROM users 
          WHERE id = auth.uid() AND company_id IS NOT NULL
        )
      );
      
  END IF;
END $$;

-- Step 8: Verify RLS is working properly
-- ============================================================================

-- Test query to verify policies work (should return user data for authenticated user)
-- You can run this after applying the policies to test:
-- SELECT id, email, name, role FROM users WHERE id = auth.uid();

-- Step 9: Grant necessary permissions
-- ============================================================================

-- Ensure authenticated users can access their own data
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated; 
GRANT SELECT, INSERT, UPDATE ON user_devices TO authenticated;

-- Grant select on companies for users who belong to them
GRANT SELECT ON companies TO authenticated;

-- Grant access to templates and ai_generations if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'templates') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_generations') THEN
    GRANT SELECT, INSERT ON ai_generations TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- If this completes without errors, RLS policies are now fixed!
SELECT 'RLS policies successfully updated! No more infinite recursion.' as status;

-- You can test the authentication system now. The errors should be gone.