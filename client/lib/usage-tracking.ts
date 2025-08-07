import { supabase, isSupabaseConfigured } from './supabase';
import { UsageStats, GenerationRequest, User } from './supabase-types';

/**
 * Get current usage statistics for a user
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  try {
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhY3VxZ3l5Y3RhdHduYmVta3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzNzkxNCwiZXhwIjoyMDY5ODEzOTE0fQ.yfQNpr0Rk9Xlr7fVTOu8-GXBoo2Wc-P_Gjc7R3_W9CA';
    
    // Get user data with current usage
    const userResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=*&id=eq.${userId}`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error('Error fetching user usage:', await userResponse.text());
      return null;
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];

    // Get device count
    const deviceResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_devices?select=*&user_id=eq.${userId}&status=eq.active`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    let deviceCount = 0;
    if (deviceResponse.ok) {
      const devices = await deviceResponse.json();
      deviceCount = devices ? devices.length : 0;
    }

    const currentDate = new Date();
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    return {
      daily: {
        used: user.daily_usage || 0,
        limit: user.daily_limit || 0,
        remaining: Math.max(0, (user.daily_limit || 0) - (user.daily_usage || 0)),
        resetTime: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      },
      monthly: {
        used: user.monthly_usage || 0,
        limit: user.monthly_limit || 0,
        remaining: Math.max(0, (user.monthly_limit || 0) - (user.monthly_usage || 0)),
        resetTime: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000)
      },
      devices: {
        count: deviceCount,
        limit: user.device_limit || 1,
        remaining: Math.max(0, (user.device_limit || 1) - deviceCount)
      },
      isUnlimited: user.daily_limit === -1 || user.role === 'superuser',
      planType: user.role || 'free',
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error in getUserUsageStats:', error);
    return null;
  }
}

/**
 * Check if user can perform a generation
 */
export async function canUserGenerate(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // Always allow in demo mode
    return true;
  }

  try {
    const { data, error } = await supabase
      .rpc('can_user_generate', { user_uuid: userId });

    if (error) {
      console.error('Error checking generation availability:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in canUserGenerate:', error);
    return false;
  }
}

/**
 * Track a new AI generation
 */
export async function trackGeneration(request: GenerationRequest, success: boolean, error?: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Generation tracked in demo mode:', { request, success, error });
    return;
  }

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('No authenticated user for tracking generation');
      return;
    }

    // Insert generation record
    const { error: insertError } = await supabase
      .from('ai_generations')
      .insert([
        {
          user_id: user.id,
          source: request.source,
          generation_type: request.generationType,
          language: request.language,
          tone: request.tone,
          intent: request.intent || null,
          input_length: request.originalMessage?.length || request.prompt?.length || 0,
          encrypted: request.encrypted,
          success,
          error_message: error || null
        }
      ]);

    if (insertError) {
      console.error('Error inserting generation record:', insertError);
      return;
    }

    // Increment usage counters for successful generations
    if (success) {
      const { error: incrementError } = await supabase
        .rpc('increment_user_usage', { user_uuid: user.id });

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
      }
    }

  } catch (error) {
    console.error('Error in trackGeneration:', error);
  }
}

/**
 * Register a new device for the user
 */
export async function registerDevice(deviceFingerprint: string, deviceName?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Device registration in demo mode');
    return true;
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('No authenticated user for device registration');
      return false;
    }

    // Check if user has reached device limit
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('device_limit, role')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      console.error('Error fetching user for device check:', userError);
      return false;
    }

    // Count current devices
    const { count: deviceCount, error: countError } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting devices:', countError);
      return false;
    }

    // Check device limit (unlimited for enterprise users)
    const isUnlimited = currentUser.device_limit === -1 || 
                       ['pro_plus', 'enterprise_manager', 'enterprise_user', 'superuser'].includes(currentUser.role);

    if (!isUnlimited && (deviceCount || 0) >= currentUser.device_limit) {
      console.warn('User has reached device limit');
      return false;
    }

    // Register the device
    const { error: insertError } = await supabase
      .from('user_devices')
      .upsert([
        {
          user_id: user.id,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName || 'Unknown Device',
          last_active: new Date().toISOString()
        }
      ], {
        onConflict: 'user_id,device_fingerprint'
      });

    if (insertError) {
      console.error('Error registering device:', insertError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error in registerDevice:', error);
    return false;
  }
}

/**
 * Update device activity
 */
export async function updateDeviceActivity(deviceFingerprint: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    await supabase
      .from('user_devices')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('device_fingerprint', deviceFingerprint);

  } catch (error) {
    console.error('Error updating device activity:', error);
  }
}

/**
 * Get user devices
 */
export async function getUserDevices(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_active', { ascending: false });

    if (error) {
      console.error('Error fetching user devices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserDevices:', error);
    return [];
  }
}

/**
 * Remove a device
 */
export async function removeDevice(deviceId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id); // Ensure user can only remove their own devices

    if (error) {
      console.error('Error removing device:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeDevice:', error);
    return false;
  }
}

/**
 * Generate a simple device fingerprint
 */
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Hook for usage stats (to be used in React components)
 */
export async function useUsageStats(user: User | null): Promise<UsageStats | null> {
  if (!user) return null;
  return getUserUsageStats(user.id);
}
