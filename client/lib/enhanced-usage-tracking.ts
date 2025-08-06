import { supabase, isSupabaseConfigured } from './supabase';
import { UsageStats, GenerationRequest, User } from './supabase-types';

// Enhanced usage stats with extension tracking
export interface EnhancedUsageStats extends UsageStats {
  websiteUsage: number;
  extensionUsage: number;
  todayWebsiteUsage: number;
  todayExtensionUsage: number;
  totalWebsiteUsage: number;
  totalExtensionUsage: number;
  recentGenerations?: Array<{
    id: string;
    source: 'website' | 'extension';
    generation_type: 'email' | 'reply';
    created_at: string;
    success: boolean;
  }>;
}

/**
 * Get enhanced usage statistics with source breakdown
 */
export async function getEnhancedUsageStats(userId: string): Promise<EnhancedUsageStats | null> {
  if (!isSupabaseConfigured || !supabase) {
    // Return mock data for demo mode with extension usage
    return {
      dailyUsed: 2,
      dailyLimit: 3,
      monthlyUsed: 8,
      monthlyLimit: 30,
      deviceCount: 1,
      deviceLimit: 1,
      isUnlimited: false,
      websiteUsage: 5,
      extensionUsage: 3,
      todayWebsiteUsage: 1,
      todayExtensionUsage: 1,
      totalWebsiteUsage: 12,
      totalExtensionUsage: 8,
      recentGenerations: [
        { 
          id: '1', 
          source: 'website', 
          generation_type: 'email', 
          created_at: new Date().toISOString(), 
          success: true 
        },
        { 
          id: '2', 
          source: 'extension', 
          generation_type: 'reply', 
          created_at: new Date().toISOString(), 
          success: true 
        }
      ]
    };
  }

  try {
    // Use the enhanced breakdown function
    const { data, error } = await supabase
      .rpc('get_user_usage_breakdown', { user_uuid: userId });

    if (error) {
      console.error('Error fetching enhanced usage stats:', error);
      return null;
    }

    if (!data) return null;

    return {
      dailyUsed: data.daily_used || 0,
      dailyLimit: data.daily_limit || 3,
      monthlyUsed: data.monthly_used || 0,
      monthlyLimit: data.monthly_limit || 30,
      deviceCount: data.device_count || 0,
      deviceLimit: data.device_limit || 1,
      isUnlimited: data.is_unlimited || false,
      websiteUsage: data.website_month || 0,
      extensionUsage: data.extension_month || 0,
      todayWebsiteUsage: data.website_today || 0,
      todayExtensionUsage: data.extension_today || 0,
      totalWebsiteUsage: data.total_website || 0,
      totalExtensionUsage: data.total_extension || 0,
      recentGenerations: data.recent_activity || []
    };

  } catch (error) {
    console.error('Error in getEnhancedUsageStats:', error);
    return null;
  }
}

/**
 * Get current usage statistics (backward compatibility)
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  const enhanced = await getEnhancedUsageStats(userId);
  if (!enhanced) return null;

  return {
    dailyUsed: enhanced.dailyUsed,
    dailyLimit: enhanced.dailyLimit,
    monthlyUsed: enhanced.monthlyUsed,
    monthlyLimit: enhanced.monthlyLimit,
    deviceCount: enhanced.deviceCount,
    deviceLimit: enhanced.deviceLimit,
    isUnlimited: enhanced.isUnlimited
  };
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
 * Track a new AI generation with enhanced source tracking
 */
export async function trackGeneration(
  request: GenerationRequest, 
  success: boolean, 
  error?: string,
  outputLength?: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Generation tracked in demo mode:', { request, success, error });
    return true;
  }

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('No authenticated user for tracking generation');
      return false;
    }

    // Use the enhanced tracking function
    const { data: trackResult, error: trackError } = await supabase
      .rpc('track_ai_generation', {
        user_uuid: user.id,
        generation_source: request.source || 'website',
        generation_type: request.generationType || 'email',
        language: request.language || 'en',
        tone: request.tone || 'professional',
        intent: request.intent || null,
        input_length: request.originalMessage?.length || request.prompt?.length || 0,
        output_length: outputLength || 0,
        success,
        error_message: error || null
      });

    if (trackError) {
      console.error('Error tracking generation:', trackError);
      return false;
    }

    return trackResult || false;

  } catch (error) {
    console.error('Error in trackGeneration:', error);
    return false;
  }
}

/**
 * Validate extension access for a user device
 */
export async function validateExtensionAccess(userId: string, deviceFingerprint: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Extension access validated in demo mode');
    return true;
  }

  try {
    const { data, error } = await supabase
      .rpc('validate_extension_access', {
        user_uuid: userId,
        device_fingerprint: deviceFingerprint
      });

    if (error) {
      console.error('Error validating extension access:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in validateExtensionAccess:', error);
    return false;
  }
}

/**
 * Get user limits specifically formatted for extension use
 */
export async function getUserLimitsForExtension(userId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      role: 'free',
      daily_limit: 3,
      monthly_limit: 30,
      daily_used: 1,
      monthly_used: 5,
      daily_remaining: 2,
      monthly_remaining: 25,
      is_unlimited: false,
      can_generate: true,
      status: 'active'
    };
  }

  try {
    const { data, error } = await supabase
      .rpc('get_user_limits_for_extension', { user_uuid: userId });

    if (error) {
      console.error('Error fetching user limits for extension:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserLimitsForExtension:', error);
    return null;
  }
}

/**
 * Log extension errors for debugging
 */
export async function logExtensionError(
  userId: string, 
  errorType: string, 
  errorMessage: string, 
  contextData?: any
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.error('Extension Error (Demo Mode):', { errorType, errorMessage, contextData });
    return;
  }

  try {
    await supabase.rpc('log_extension_error', {
      user_uuid: userId,
      error_type: errorType,
      error_message: errorMessage,
      context_data: contextData || null
    });
  } catch (error) {
    console.error('Error logging extension error:', error);
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

    // Check if user can register device using enhanced function
    const { data: canRegister, error: checkError } = await supabase
      .rpc('can_register_device', {
        user_uuid: user.id,
        device_fingerprint: deviceFingerprint
      });

    if (checkError || !canRegister) {
      console.error('Cannot register device:', checkError?.message || 'Device limit reached');
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
 * Hook for enhanced usage stats (to be used in React components)
 */
export async function useEnhancedUsageStats(user: User | null): Promise<EnhancedUsageStats | null> {
  if (!user) return null;
  return getEnhancedUsageStats(user.id);
}

// Export backward compatibility functions
export {
  // Existing exports for backward compatibility
  getUserUsageStats as useUsageStats
};