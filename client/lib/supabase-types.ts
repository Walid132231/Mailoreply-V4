// Updated Supabase TypeScript types for clean schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'superuser' | 'enterprise_manager' | 'enterprise_user' | 'pro_plus' | 'pro' | 'free';
          company_id: string | null;
          status: 'active' | 'suspended';
          daily_limit: number; // -1 for unlimited
          monthly_limit: number; // -1 for unlimited  
          device_limit: number; // -1 for unlimited
          daily_usage: number;
          monthly_usage: number;
          last_daily_reset: string;
          last_monthly_reset: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'superuser' | 'enterprise_manager' | 'enterprise_user' | 'pro_plus' | 'pro' | 'free';
          company_id?: string | null;
          status?: 'active' | 'suspended';
          daily_limit?: number;
          monthly_limit?: number;
          device_limit?: number;
          daily_usage?: number;
          monthly_usage?: number;
          last_daily_reset?: string;
          last_monthly_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'superuser' | 'enterprise_manager' | 'enterprise_user' | 'pro_plus' | 'pro' | 'free';
          company_id?: string | null;
          status?: 'active' | 'suspended';
          daily_limit?: number;
          monthly_limit?: number;
          device_limit?: number;
          daily_usage?: number;
          monthly_usage?: number;
          last_daily_reset?: string;
          last_monthly_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          plan: 'free' | 'pro' | 'pro_plus' | 'enterprise';
          max_users: number;
          current_users: number;
          domain: string | null;
          status: 'active' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: 'free' | 'pro' | 'pro_plus' | 'enterprise';
          max_users?: number;
          current_users?: number;
          domain?: string | null;
          status?: 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: 'free' | 'pro' | 'pro_plus' | 'enterprise';
          max_users?: number;
          current_users?: number;
          domain?: string | null;
          status?: 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          always_encrypt: boolean;
          encryption_enabled: boolean;
          default_language: string;
          default_tone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          always_encrypt?: boolean;
          encryption_enabled?: boolean;
          default_language?: string;
          default_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          always_encrypt?: boolean;
          encryption_enabled?: boolean;
          default_language?: string;
          default_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_devices: {
        Row: {
          id: string;
          user_id: string;
          device_fingerprint: string;
          device_name: string | null;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_fingerprint: string;
          device_name?: string | null;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_fingerprint?: string;
          device_name?: string | null;
          last_active?: string;
          created_at?: string;
        };
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          source: 'website' | 'extension';
          generation_type: string; // 'reply' or 'email'
          language: string;
          tone: string;
          intent: string | null;
          input_length: number | null;
          output_length: number | null;
          encrypted: boolean;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          source: 'website' | 'extension';
          generation_type: string;
          language: string;
          tone: string;
          intent?: string | null;
          input_length?: number | null;
          output_length?: number | null;
          encrypted?: boolean;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          source?: 'website' | 'extension';
          generation_type?: string;
          language?: string;
          tone?: string;
          intent?: string | null;
          input_length?: number | null;
          output_length?: number | null;
          encrypted?: boolean;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          title: string;
          content: string;
          subject: string | null;
          hotkey: string | null;
          visibility: string; // 'private' | 'company'
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          title: string;
          content: string;
          subject?: string | null;
          hotkey?: string | null;
          visibility?: string;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          title?: string;
          content?: string;
          subject?: string | null;
          hotkey?: string | null;
          visibility?: string;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_user_generate: {
        Args: {
          user_uuid: string;
        };
        Returns: boolean;
      };
      increment_user_usage: {
        Args: {
          user_uuid: string;
        };
        Returns: void;
      };
      reset_daily_usage: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: 'superuser' | 'enterprise_manager' | 'enterprise_user' | 'pro_plus' | 'pro' | 'free';
      user_status: 'active' | 'suspended';
      plan_type: 'free' | 'pro' | 'pro_plus' | 'enterprise';
      generation_source: 'website' | 'extension';
    };
  };
}

// Convenience types
export type UserRole = Database['public']['Enums']['user_role'];
export type UserStatus = Database['public']['Enums']['user_status'];
export type PlanType = Database['public']['Enums']['plan_type'];
export type GenerationSource = Database['public']['Enums']['generation_source'];

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Company = Database['public']['Tables']['companies']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserDevice = Database['public']['Tables']['user_devices']['Row'];
export type AIGeneration = Database['public']['Tables']['ai_generations']['Row'];
export type Template = Database['public']['Tables']['templates']['Row'];

// AI Generation types
export interface GenerationRequest {
  source: GenerationSource;
  generationType: 'reply' | 'email';
  language: string;
  tone: string;
  intent?: string; // only for replies
  prompt?: string; // only for emails
  originalMessage?: string; // only for replies
  encrypted: boolean;
}

export interface GenerationResponse {
  success: boolean;
  content?: string;
  subject?: string; // only for emails
  error?: string;
}

// Usage tracking types
export interface UsageStats {
  dailyUsed: number;
  dailyLimit: number; // -1 for unlimited
  monthlyUsed: number;
  monthlyLimit: number; // -1 for unlimited
  deviceCount: number;
  deviceLimit: number; // -1 for unlimited
  isUnlimited: boolean;
}

// Constants for AI generation
export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Dutch', 'Russian', 'Chinese (Simplified)', 'Chinese (Traditional)', 
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Polish', 'Swedish', 
  'Norwegian', 'Danish', 'Finnish', 'Turkish'
] as const;

export const TONES = [
  'Friendly', 'Professional', 'Polite', 'Direct', 'Apologetic', 
  'Thankful', 'Urgent'
] as const;

export const INTENTS = [
  'Say Yes', 'Say No', 'Ask for More Info', 'Delay Reply', 'Follow Up',
  'Confirm Something', 'Decline Politely', 'Request Action', 'Thank Sender',
  'Acknowledge Message'
] as const;

export type Language = typeof LANGUAGES[number];
export type Tone = typeof TONES[number];
export type Intent = typeof INTENTS[number];
