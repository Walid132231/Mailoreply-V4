import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Lock, Chrome, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/NewAuthContext';

export default function NewLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user && !loading && !isLoading) {
      console.log('🎯 User is already logged in, redirecting to dashboard...');
      setIsRedirecting(true);
      setSuccess('Already logged in! Redirecting...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    }
  }, [user, loading, navigate, from, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isRedirecting) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 Starting login process...');
      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Login API call successful, waiting for auth state...');
        setSuccess('Login successful! Redirecting...');
        
        // Wait for user to be set by monitoring the user state
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds max
        
        const checkForUser = () => {
          attempts++;
          
          // Force a small delay then check if we have a user
          setTimeout(() => {
            // The user state will be updated by the AuthContext
            if (user || attempts > maxAttempts) {
              console.log('✅ User state updated, redirecting to dashboard...');
              setIsRedirecting(true);
              setTimeout(() => {
                navigate(from, { replace: true });
              }, 300);
            } else if (attempts < maxAttempts) {
              console.log(`🔄 Waiting for user state... attempt ${attempts}`);
              checkForUser();
            } else {
              console.log('⚠️ Timeout waiting for user, redirecting anyway...');
              setIsRedirecting(true);
              navigate(from, { replace: true });
            }
          }, 200);
        };
        
        checkForUser();
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading || isRedirecting) return;

    setIsLoading(true);
    setError('');
    
    try {
      const result = await loginWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
      // Google OAuth will handle redirect automatically
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getLoadingMessage = () => {
    if (isRedirecting) return 'Redirecting to dashboard...';
    if (isLoading) return 'Signing you in...';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back to Home */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto text-brand-600 hover:text-brand-700">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Main Login Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in to your MailoReply account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {(isLoading || isRedirecting) && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-800 font-medium">{getLoadingMessage()}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || isRedirecting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || isRedirecting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700"
                disabled={isLoading || isRedirecting}
              >
                {isLoading && !isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRedirecting && <CheckCircle className="mr-2 h-4 w-4" />}
                {isRedirecting ? 'Success!' : isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoogleLogin}
              className="w-full"
              disabled={isLoading || isRedirecting}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            {/* Footer Links */}
            <div className="flex items-center justify-between text-sm">
              <Link 
                to="/signup" 
                className="text-brand-600 hover:text-brand-700 hover:underline"
              >
                Create account
              </Link>
              <Link 
                to="/forgot-password" 
                className="text-gray-600 hover:text-gray-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Login for Testing */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Test Login</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Admin:</strong> admin@mailoreply.com / Admin123!</div>
            <div className="text-xs text-gray-500">
              Use these credentials for testing the admin dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}