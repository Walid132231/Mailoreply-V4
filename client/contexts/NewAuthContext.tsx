import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, UserSettings, Company, UserRole } from '@/lib/supabase-types';

// Export UserRole for ProtectedRoute
export type { UserRole };

// Enhanced Auth Context Interface
interface AuthContextType {
  user: User | null;
  session: Session | null;
  company: Company | null;
  settings: UserSettings | null;
  loading: boolean;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // User actions
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  
  // Device fingerprint for tracking
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

// Device fingerprint generation
function generateDeviceFingerprint(): string {
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
  
  return btoa(fingerprint).substring(0, 32);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceFingerprint] = useState<string>(() => generateDeviceFingerprint());

  // Fix page reload/tab switching issue with visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session && !user) {
        // Page became visible and we have session but no user - refresh user data
        console.log('🔄 Page became visible, refreshing user data...');
        fetchUserProfile(session.user);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, user]);

  // Initialize authentication
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        await fetchUserProfile(initialSession.user);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 Auth state changed:', event, session?.user?.id);
          
          setSession(session);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            clearUserData();
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('🔄 Starting fetchUserProfile for:', supabaseUser.email);
    setLoading(true);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000); // 10 second timeout
      });

      const profilePromise = async () => {
        // Now that RLS is fixed, use normal Supabase client calls
        console.log('📡 Fetching user profile from database...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (userError) {
          console.error('❌ Error fetching user profile:', userError.message);
          
          // If user doesn't exist, create profile
          if (userError.code === 'PGRST116') {
            console.log('👤 User not found, creating profile...');
            await createUserProfile(supabaseUser);
            return;
          }
          
          // Create fallback user object to prevent blocking
          console.log('🔄 Creating fallback user to prevent blocking...');
          const fallbackUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            role: 'free',
            status: 'active',
            daily_limit: 3,
            monthly_limit: 30,
            device_limit: 1,
            daily_usage: 0,
            monthly_usage: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(fallbackUser);
          return;
        }

        // Set user data
        console.log('✅ User profile loaded successfully:', userData.email, userData.role);
        setUser(userData);

        // Fetch related data in parallel (non-blocking)
        console.log('🔄 Loading additional user data...');
        try {
          await Promise.allSettled([
            fetchUserSettings(userData.id),
            userData.company_id ? fetchCompanyProfile(userData.company_id) : Promise.resolve(),
            registerUserDevice()
          ]);
        } catch (parallelError) {
          console.error('⚠️ Error loading additional data (non-critical):', parallelError);
        }
      };

      // Race between profile loading and timeout
      await Promise.race([profilePromise(), timeoutPromise]);

    } catch (error) {
      console.error('❌ Error in fetchUserProfile (creating fallback):', error);
      
      // Always set fallback user to prevent auth blocking
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || 'User',
        role: supabaseUser.email === 'admin@mailoreply.com' ? 'superuser' : 'free', // Special case for admin
        status: 'active',
        daily_limit: supabaseUser.email === 'admin@mailoreply.com' ? -1 : 3,
        monthly_limit: supabaseUser.email === 'admin@mailoreply.com' ? -1 : 30,
        device_limit: supabaseUser.email === 'admin@mailoreply.com' ? -1 : 1,
        daily_usage: 0,
        monthly_usage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUser(fallbackUser);
    } finally {
      console.log('✅ fetchUserProfile completed, setting loading to false');
      setLoading(false);
    }
  };

  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const newUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        role: 'free' as UserRole,
        status: 'active',
        daily_limit: 3,
        monthly_limit: 30,
        device_limit: 1,
        daily_usage: 0,
        monthly_usage: 0
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
        // Set fallback user
        setUser({
          ...newUser,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      setUser(data);

      // Create default settings
      await supabase
        .from('user_settings')
        .insert([{ 
          user_id: supabaseUser.id,
          always_encrypt: false,
          encryption_enabled: false,
          default_language: 'English',
          default_tone: 'Professional'
        }]);

    } catch (error) {
      console.error('❌ Error in createUserProfile:', error);
    }
  };

  const fetchUserSettings = async (userId: string) => {
    try {
      const { data: settingsData, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && settingsData) {
        setSettings(settingsData);
      } else if (error.code === 'PGRST116') {
        // Create default settings if they don't exist
        const defaultSettings = {
          user_id: userId,
          always_encrypt: false,
          encryption_enabled: false,
          default_language: 'English',
          default_tone: 'Professional'
        };

        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (newSettings) setSettings(newSettings);
      }
    } catch (error) {
      console.error('⚠️ Error fetching settings (non-critical):', error);
    }
  };

  const fetchCompanyProfile = async (companyId: string) => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!error && companyData) {
        setCompany(companyData);
        console.log('✅ Company profile loaded');
      }
    } catch (error) {
      console.error('⚠️ Error fetching company (non-critical):', error);
    }
  };

  const registerUserDevice = async () => {
    if (!user) return;
    
    try {
      // Check if device already exists
      const { data: existingDevice } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (existingDevice) {
        // Update last seen
        await supabase
          .from('user_devices')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existingDevice.id);
      } else {
        // Register new device
        await supabase
          .from('user_devices')
          .insert([{
            user_id: user.id,
            device_fingerprint: deviceFingerprint,
            device_name: navigator.userAgent.includes('Chrome') ? 'Chrome Browser' : 'Web Browser',
            status: 'active'
          }]);
      }
    } catch (error) {
      console.error('⚠️ Error registering device (non-critical):', error);
    }
  };

  // Authentication Methods
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication not configured' };
    }

    try {
      console.log('🔐 Starting login process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login failed:', error.message);
        setLoading(false);
        return { success: false, error: error.message };
      }

      console.log('✅ Login successful, auth state change will trigger profile fetch');
      // Don't set loading to false here - let the auth state change handler manage it
      return { success: true };
    } catch (error: any) {
      console.error('❌ Unexpected login error:', error);
      setLoading(false);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication not configured' };
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        setLoading(false);
        return { success: true, error: 'Please check your email to confirm your account' };
      }

      return { success: true };
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Signup error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Authentication not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      clearUserData();
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearUserData = () => {
    setUser(null);
    setSession(null);
    setCompany(null);
    setSettings(null);
  };

  // User Management Methods
  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !supabase) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setUser({ ...user, ...data });
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !supabase) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setSettings({ ...settings, ...data });
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error updating settings:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    company,
    settings,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUser,
    updateSettings,
    refreshUser,
    deviceFingerprint,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}