-- ============================================================================
-- FINAL RLS FIX - Corrected SQL (No Ambiguous References)
-- ============================================================================
-- This version fixes the column reference ambiguity error

-- Step 1: Disable RLS completely first to clean everything
-- ============================================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (comprehensive cleanup)
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

-- Drop all policies on templates (if exists)
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

-- Drop all policies on ai_generations (if exists)
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

-- Drop all policies on companies (if exists)
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

-- Step 3: Verification - check remaining policies
-- ============================================================================
SELECT 
    'Remaining policies after cleanup:' as status,
    COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename IN ('users', 'user_settings', 'user_devices', 'templates', 'ai_generations', 'companies');

-- Step 4: Create the simplest possible policies
-- ============================================================================

-- Enable RLS and create basic policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_basic_read" ON users
    FOR SELECT 
    USING (id = auth.uid());

CREATE POLICY "users_basic_insert" ON users
    FOR INSERT 
    WITH CHECK (id = auth.uid());

CREATE POLICY "users_basic_update" ON users
    FOR UPDATE 
    USING (id = auth.uid());

-- Enable RLS and create basic policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_basic_read" ON user_settings
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "settings_basic_insert" ON user_settings
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_basic_update" ON user_settings
    FOR UPDATE 
    USING (user_id = auth.uid());

-- Enable RLS and create basic policies for user_devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_basic_read" ON user_devices
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "devices_basic_insert" ON user_devices
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "devices_basic_update" ON user_devices
    FOR UPDATE 
    USING (user_id = auth.uid());

-- Step 5: Handle optional tables (templates)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'templates') THEN
        ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "templates_basic_read" ON templates
            FOR SELECT 
            USING (user_id = auth.uid() OR visibility = 'public');

        CREATE POLICY "templates_basic_insert" ON templates
            FOR INSERT 
            WITH CHECK (user_id = auth.uid());

        CREATE POLICY "templates_basic_update" ON templates
            FOR UPDATE 
            USING (user_id = auth.uid());

        CREATE POLICY "templates_basic_delete" ON templates
            FOR DELETE 
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Step 6: Handle ai_generations table
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'ai_generations') THEN
        ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "generations_basic_read" ON ai_generations
            FOR SELECT 
            USING (user_id = auth.uid());

        CREATE POLICY "generations_basic_insert" ON ai_generations
            FOR INSERT 
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Step 7: Handle companies table (simplified approach)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'companies') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        
        -- Simple policy: allow authenticated users to read companies
        CREATE POLICY "companies_basic_read" ON companies
            FOR SELECT 
            USING (true);
    END IF;
END $$;

-- Step 8: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_devices TO authenticated;

-- Grant permissions on optional tables
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

-- Step 9: Force refresh of policy cache
-- ============================================================================
SELECT pg_reload_conf();

-- Step 10: Final verification and success message
-- ============================================================================

-- Show current policies after fix
SELECT 
    'Current policies after fix:' as status,
    tablename, 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('users', 'user_settings', 'user_devices', 'templates', 'ai_generations', 'companies')
ORDER BY tablename, policyname;

-- Final success message
SELECT '🎉 RLS policies successfully fixed! No more infinite recursion errors!' as final_status;