import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, User, Company, UserRole, UserSettings } from '@/lib/supabase';
import { generateDeviceFingerprint, registerDevice, updateDeviceActivity } from '@/lib/usage-tracking';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  settings: UserSettings | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signupWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshUser: () => Promise<void>;
  deviceFingerprint: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceFingerprint] = useState<string>(() => generateDeviceFingerprint());

  // Production initialization - requires proper Supabase configuration
  const initializeProductionAuth = () => {
    console.warn('Authentication service not configured - users cannot login');
    // Clear any existing fallback sessions
    localStorage.removeItem('mailoreply_fallback_user');
    localStorage.removeItem('mailoreply_fallback_settings');
    setLoading(false);
  };

  // No demo users in production - require proper Supabase configuration

  const handleFallbackLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // No fallback authentication in production
    return {
      success: false,
      error: 'Authentication service not configured. Please contact administrator.'
    };
  };

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured - authentication unavailable');
      initializeProductionAuth();
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      setSession(session);

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Use direct API call with service role for profile fetch to avoid RLS issues
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=*&id=eq.${supabaseUser.id}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error fetching user profile:', await response.text());
        
        // If user doesn't exist in our table, create them
        if (response.status === 404) {
          await createUserProfile(supabaseUser);
          return;
        }
        
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const users = await response.json();
      if (users && users.length > 0) {
        const userData = users[0];
        setUser(userData);

        // Fetch user settings
        await fetchUserSettings(userData.id);

        // Fetch company data if user belongs to one
        if (userData.company_id) {
          await fetchCompanyProfile(userData.company_id);
        }

        // Register/update device
        await registerDevice(deviceFingerprint, getUserAgentDevice());
        await updateDeviceActivity(deviceFingerprint);
      }

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async (userId: string) => {
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError) {
        // Create default settings if they don't exist
        if (settingsError.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert([{ user_id: userId }])
            .select()
            .single();

          if (!createError && newSettings) {
            setSettings(newSettings);
          }
        }
      } else {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const getUserAgentDevice = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome Browser';
    if (ua.includes('Firefox')) return 'Firefox Browser';
    if (ua.includes('Safari')) return 'Safari Browser';
    if (ua.includes('Edge')) return 'Edge Browser';
    return 'Unknown Browser';
  };

  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
            role: 'free' as UserRole,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create default settings
      await supabase
        .from('user_settings')
        .insert([{ user_id: supabaseUser.id }]);

      // Recursively fetch the created profile
      await fetchUserProfile(supabaseUser);
    } catch (error) {
      console.error('Error creating user profile:', error);
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async (companyId: string) => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const companyProfile: Company = {
        id: companyData.id,
        name: companyData.name,
        domain: companyData.domain,
        subscription_plan: companyData.subscription_plan,
        max_users: companyData.max_users,
        current_users: companyData.current_users,
        ai_generations_limit: companyData.ai_generations_limit,
        ai_generations_used: companyData.ai_generations_used,
        monthly_payment: companyData.monthly_payment,
        status: companyData.status,
        contract_start_date: companyData.contract_start_date,
        contract_end_date: companyData.contract_end_date,
      };

      setCompany(companyProfile);
      
      // Update user with company name
      if (user) {
        setUser({ ...user, company_name: companyProfile.name });
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Fallback authentication when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      return handleFallbackLogin(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // fetchUserProfile will be called by the auth state change listener
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Authentication service not configured. Please contact administrator.'
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth redirect happens automatically, no need to return success immediately
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signupWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Same as loginWithGoogle since OAuth handles both cases
    return loginWithGoogle();
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    invitationToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Fallback when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Authentication service not configured. Please contact administrator.'
      };
    }

    try {
      // If there's an invitation token, validate it first
      let invitationData = null;
      if (invitationToken) {
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('*, companies(*)')
          .eq('token', invitationToken)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (inviteError || !invitation) {
          return { success: false, error: 'Invalid or expired invitation' };
        }

        invitationData = invitation;
      }

      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            invitation_token: invitationToken,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // If user needs email confirmation, let them know
        if (!data.session) {
          return { 
            success: true, 
            error: 'Please check your email to confirm your account' 
          };
        }

        // If there was an invitation, update the invitation status
        if (invitationToken && invitationData) {
          await supabase
            .from('invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              accepted_by: data.user.id,
            })
            .eq('token', invitationToken);
        }

        return { success: true };
      }

      return { success: false, error: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<void> => {
    if (!user || !settings) return;

    // Fallback when database not configured
    if (!isSupabaseConfigured || !supabase) {
      const updatedSettings = { ...settings, ...updates };
      setSettings(updatedSettings);
      localStorage.setItem('mailoreply_fallback_settings', JSON.stringify(updatedSettings));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSettings({ ...settings, ...updates });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    // Fallback when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setCompany(null);
      setSettings(null);
      setSession(null);
      localStorage.removeItem('mailoreply_fallback_user');
      localStorage.removeItem('mailoreply_fallback_settings');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    // State will be updated by the auth state change listener
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    // Fallback when database not configured
    if (!isSupabaseConfigured || !supabase) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('mailoreply_fallback_user', JSON.stringify(updatedUser));
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  };

  const value: AuthContextType = {
    user,
    company,
    settings,
    session,
    loading,
    login,
    loginWithGoogle,
    signup,
    signupWithGoogle,
    logout,
    updateUser,
    updateSettings,
    refreshUser,
    deviceFingerprint,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
