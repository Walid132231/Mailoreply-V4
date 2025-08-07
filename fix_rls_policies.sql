-- Fix RLS Policies for MailoReply AI
-- This resolves the infinite recursion issue

-- Temporarily disable RLS to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS users_own_data_policy ON users;
DROP POLICY IF EXISTS select_own_user_data ON users;
DROP POLICY IF EXISTS update_own_user_data ON users;
DROP POLICY IF EXISTS insert_own_user_data ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Fix user_settings policies
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_settings_policy ON user_settings;
DROP POLICY IF EXISTS select_own_settings ON user_settings;
DROP POLICY IF EXISTS update_own_settings ON user_settings;
DROP POLICY IF EXISTS insert_own_settings ON user_settings;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_own" ON user_settings
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "settings_insert_own" ON user_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update_own" ON user_settings
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Fix user_devices policies  
ALTER TABLE user_devices DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_devices_policy ON user_devices;
DROP POLICY IF EXISTS select_own_devices ON user_devices;
DROP POLICY IF EXISTS insert_own_devices ON user_devices;
DROP POLICY IF EXISTS update_own_devices ON user_devices;

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_select_own" ON user_devices
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "devices_insert_own" ON user_devices
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices_update_own" ON user_devices
  FOR UPDATE 
  USING (auth.uid() = user_id);