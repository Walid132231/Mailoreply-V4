import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase-types';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured with real values (not demo/placeholder values)
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('demo-supabase-url') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('demo-anon-key') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Check if service role is configured
export const isServiceRoleConfigured = !!(
  supabaseUrl &&
  supabaseServiceRoleKey &&
  isSupabaseConfigured
);

// Create Supabase client with proper configuration or null if not configured
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Create service role client for administrative operations (bypasses RLS)
export const supabaseServiceRole = isServiceRoleConfigured
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to check if Supabase operations are available
export const checkSupabaseAvailable = () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    return false;
  }
  return true;
};

// Re-export types for convenience
export type { Database } from './supabase-types';
export type {
  User,
  Company,
  UserSettings,
  UserDevice,
  AIGeneration,
  Template,
  UserRole,
  UserStatus,
  PlanType,
  GenerationSource,
  GenerationRequest,
  GenerationResponse,
  UsageStats,
  Language,
  Tone,
  Intent
} from './supabase-types';
