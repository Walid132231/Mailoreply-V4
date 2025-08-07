-- ============================================================================
-- WORKING RLS FIX - No Superuser Functions Required
-- ============================================================================
-- This version removes the pg_reload_conf() call that requires superuser access

-- Step 1: Disable RLS completely to clean everything
-- ============================================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
-- ============================================================================

-- Drop all policies on users table
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON users';
    END LOOP;
END $$;

-- Drop all policies on user_settings
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_settings'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON user_settings';
    END LOOP;
END $$;

-- Drop all policies on user_devices
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_devices'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON user_devices';
    END LOOP;
END $$;

-- Drop policies on optional tables
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'templates') THEN
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'templates'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON templates';
        END LOOP;
    END IF;
END $$;

DO $$
DECLARE
    pol_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'ai_generations') THEN
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'ai_generations'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON ai_generations';
        END LOOP;
    END IF;
END $$;

DO $$
DECLARE
    pol_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'companies') THEN
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'companies'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON companies';
        END LOOP;
    END IF;
END $$;

-- Step 3: Verify cleanup worked
-- ============================================================================
SELECT 
    'Policies remaining after cleanup:' as message,
    COUNT(*) as count 
FROM pg_policies 
WHERE tablename IN ('users', 'user_settings', 'user_devices', 'templates', 'ai_generations', 'companies');

-- Step 4: Re-enable RLS and create simple policies
-- ============================================================================

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON users
    FOR UPDATE USING (id = auth.uid());

-- User settings policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read" ON user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "settings_insert" ON user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_update" ON user_settings
    FOR UPDATE USING (user_id = auth.uid());

-- User devices policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_read" ON user_devices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "devices_insert" ON user_devices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "devices_update" ON user_devices
    FOR UPDATE USING (user_id = auth.uid());

-- Step 5: Handle optional tables
-- ============================================================================

-- Templates (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'templates') THEN
        ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "templates_read" ON templates
            FOR SELECT USING (user_id = auth.uid() OR visibility = 'public');

        CREATE POLICY "templates_write" ON templates
            FOR INSERT WITH CHECK (user_id = auth.uid());

        CREATE POLICY "templates_update" ON templates
            FOR UPDATE USING (user_id = auth.uid());

        CREATE POLICY "templates_delete" ON templates
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- AI Generations (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'ai_generations') THEN
        ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "generations_read" ON ai_generations
            FOR SELECT USING (user_id = auth.uid());

        CREATE POLICY "generations_insert" ON ai_generations
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Companies (if exists) - simplified
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'companies') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "companies_read" ON companies
            FOR SELECT USING (true);  -- Allow authenticated users to read companies
    END IF;
END $$;

-- Step 6: Grant required permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_devices TO authenticated;

-- Grant on optional tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'templates') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'ai_generations') THEN
        GRANT SELECT, INSERT ON ai_generations TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'companies') THEN
        GRANT SELECT ON companies TO authenticated;
    END IF;
END $$;

-- Step 7: Final verification
-- ============================================================================

-- Show the new policies that were created
SELECT 
    'New policies created:' as message,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('users', 'user_settings', 'user_devices', 'templates', 'ai_generations', 'companies')
ORDER BY tablename, policyname;

-- Final success message
SELECT '✅ RLS policies successfully fixed! Authentication should work now!' as result;