import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Mail, Shield, Key, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SetupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export default function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<SetupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: 'System Administrator'
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    setChecking(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      setChecking(false);
      return;
    }

    try {
      // Check if any superuser exists in the database
      // Use a direct API call with service role key to bypass RLS issues
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=id,email,role&role=eq.superuser&status=eq.active&limit=1`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 500) {
          // Likely RLS policy issue, try to check if setup is complete via different method
          setError('Database configuration issue detected. Setup may already be complete. Try accessing the login page directly.');
        } else {
          setError(`Database connection error: ${response.status}`);
        }
        setChecking(false);
        return;
      }

      const users = await response.json();

      if (users && users.length > 0) {
        setSetupComplete(true);
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setSetupComplete(false);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setError('Database connection failed. Please check your network connection and try again.');
      } else {
        setError(`Setup check failed: ${error.message}`);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleInputChange = (field: keyof SetupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const createSuperuser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // First, create the Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'superuser'
          }
        }
      });

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // If email confirmation is required, we need to wait for confirmation
      if (!authData.session) {
        setError('Please check your email to confirm your account before proceeding.');
        setLoading(false);
        return;
      }

      // Create the user profile in our users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: 'superuser',
            status: 'active',
          }
        ]);

      if (userError) {
        console.error('Error creating user profile:', userError);
        // Try to clean up the auth user if profile creation fails
        await supabase.auth.signOut();
        throw new Error(`Profile creation error: ${userError.message}`);
      }

      // Create default settings
      await supabase
        .from('user_settings')
        .insert([{ 
          user_id: authData.user.id,
          always_encrypt: false,
          default_language: 'English',
          default_tone: 'Professional'
        }]);

      setSuccess(true);
      setSetupComplete(true);
      
      // Redirect to login after successful creation
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Error creating superuser:', error);
      setError(error.message || 'Failed to create superuser account');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-8 w-8 text-blue-600" />
                <h2 className="text-xl font-semibold">MailoReply AI</h2>
              </div>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-gray-600">Checking system setup...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">MailoReply AI</h1>
          </div>
          
          {setupComplete ? (
            <>
              <CardTitle className="text-xl text-green-800">Setup Complete!</CardTitle>
              <CardDescription className="text-green-600">
                System administrator account has been created successfully
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl">Initial System Setup</CardTitle>
              <CardDescription>
                Create your system administrator account to get started
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Setup completed successfully!</p>
                  <p className="text-sm">Your system administrator account has been created. Redirecting to login...</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {setupComplete && !success ? (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">System already configured</p>
                  <p className="text-sm">A system administrator account already exists. Redirecting to login...</p>
                </div>
              </AlertDescription>
            </Alert>
          ) : !success && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What you'll get:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Full system administration access
                  </li>
                  <li className="flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Unlimited AI generations and features
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    User and company management
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Administrator Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="admin@yourcompany.com"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={createSuperuser}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Administrator Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  This setup only needs to be completed once.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
