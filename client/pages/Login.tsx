import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowLeft, Chrome } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await loginWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
      // If successful, OAuth redirect will happen automatically
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto text-brand-600 hover:text-brand-700">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>



        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your MailoReply AI account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>



            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link to="#" className="text-sm text-gray-600 hover:text-gray-900">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Extension CTA */}
        <Card className="mt-6 bg-brand-50 border-brand-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Chrome className="h-8 w-8 text-brand-600 mx-auto mb-2" />
              <h3 className="font-semibold text-brand-900 mb-1">Install Chrome Extension</h3>
              <p className="text-sm text-brand-700 mb-3">
                Get the most out of MailoReply AI with our Chrome extension
              </p>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                Add to Chrome
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
