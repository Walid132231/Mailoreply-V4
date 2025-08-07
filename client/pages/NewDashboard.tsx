import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Mail, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  FileText,
  BarChart3,
  Monitor,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/NewAuthContext';
import { Link } from 'react-router-dom';

// Mock usage stats for now - will be replaced with real data once RLS is working
interface UsageStats {
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
  devices: { count: number; limit: number; remaining: number };
  isUnlimited: boolean;
  planType: string;
}

export default function NewDashboard() {
  const { user, loading } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user]);

  const loadUsageData = async () => {
    setDataLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data based on user role - ensure proper unlimited handling
    const mockStats: UsageStats = user?.role === 'superuser' ? {
      daily: { used: 0, limit: -1, remaining: -1 },
      monthly: { used: 0, limit: -1, remaining: -1 },
      devices: { count: 1, limit: -1, remaining: -1 },
      isUnlimited: true,
      planType: 'superuser'
    } : {
      daily: { used: 1, limit: 3, remaining: 2 },
      monthly: { used: 5, limit: 30, remaining: 25 },
      devices: { count: 1, limit: 1, remaining: 0 },
      isUnlimited: false,
      planType: user?.role || 'free'
    };
    
    setUsageStats(mockStats);
    setDataLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getPlanInfo = () => {
    if (!user) return null;

    const planDetails = {
      free: {
        name: 'Free Plan',
        description: '3 daily, 30 monthly emails',
        color: 'bg-gray-500',
        badge: 'Free'
      },
      pro: {
        name: 'Pro Plan',
        description: '10 daily, 100 monthly emails',
        color: 'bg-blue-500',
        badge: 'Pro'
      },
      pro_plus: {
        name: 'Pro Plus Plan',
        description: 'Unlimited emails',
        color: 'bg-purple-500',
        badge: 'Pro+'
      },
      enterprise_user: {
        name: 'Enterprise User',
        description: 'Unlimited emails',
        color: 'bg-green-500',
        badge: 'Enterprise'
      },
      enterprise_manager: {
        name: 'Enterprise Manager',
        description: 'Unlimited emails + team management',
        color: 'bg-green-600',
        badge: 'Manager'
      },
      superuser: {
        name: 'System Administrator',
        description: 'Full system access',
        color: 'bg-red-500',
        badge: 'Admin'
      }
    };

    return planDetails[user.role as keyof typeof planDetails] || planDetails.free;
  };

  // Enhanced Loading State
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center animate-pulse">
              <Bot className="h-8 w-8 text-brand-600" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Loading your dashboard</h3>
            <p className="text-gray-600">Setting up your workspace...</p>
          </div>
          
          {/* Loading Steps */}
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-700">Authentication verified</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-gray-700">Loading user profile...</span>
            </div>
            <div className="flex items-center space-x-3 text-sm opacity-50">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-gray-500">Fetching usage data...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // User not found state
  if (!user) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Unable to load user data</h3>
            <p className="text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            <ArrowRight className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const planInfo = getPlanInfo();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-purple-600 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {user.name || user.email.split('@')[0]}!
                </h1>
                <p className="text-brand-100 text-lg">
                  {user.role === 'superuser' 
                    ? 'System Administrator Dashboard' 
                    : 'Ready to write amazing emails with AI?'
                  }
                </p>
                
                {planInfo && (
                  <div className="flex items-center space-x-2 mt-4">
                    <Badge className={`${planInfo.color} text-white`}>
                      {planInfo.badge}
                    </Badge>
                    <span className="text-brand-100 text-sm">
                      {planInfo.description}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 bg-white/5 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Usage Overview */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-brand-600" />
                  <span>Usage Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 text-brand-600 animate-spin mx-auto" />
                        <p className="text-gray-500">Loading usage data...</p>
                      </div>
                    </div>
                  </div>
                ) : usageStats ? (
                  <div className="space-y-6">
                    {/* Usage Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Daily Usage */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">Daily Usage</span>
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        {usageStats.isUnlimited || usageStats.daily.limit === -1 ? (
                          <p className="text-2xl font-bold text-blue-900">Unlimited</p>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-blue-900">
                              {usageStats.daily.used || 0}/{usageStats.daily.limit || 0}
                            </p>
                            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(((usageStats.daily.used || 0) / (usageStats.daily.limit || 1)) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Monthly Usage */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900">Monthly Usage</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        {usageStats.isUnlimited || usageStats.monthly.limit === -1 ? (
                          <p className="text-2xl font-bold text-green-900">Unlimited</p>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-green-900">
                              {usageStats.monthly.used || 0}/{usageStats.monthly.limit || 0}
                            </p>
                            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(((usageStats.monthly.used || 0) / (usageStats.monthly.limit || 1)) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Devices */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-900">Active Devices</span>
                          <Monitor className="h-4 w-4 text-purple-600" />
                        </div>
                        {usageStats.isUnlimited || usageStats.devices.limit === -1 ? (
                          <p className="text-2xl font-bold text-purple-900">Unlimited</p>
                        ) : (
                          <p className="text-2xl font-bold text-purple-900">
                            {usageStats.devices.count || 0}/{usageStats.devices.limit || 0}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Unable to load usage data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Generate */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Quick Generate</span>
                </CardTitle>
                <CardDescription>
                  Start creating emails instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Link to="/dashboard/ai-generator">
                  <Button className="w-full bg-brand-600 hover:bg-brand-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Email
                  </Button>
                </Link>
                <Link to="/dashboard/ai-generator?mode=reply">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Reply Email
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email generated</span>
                      <span className="text-gray-400 text-xs">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Template created</span>
                      <span className="text-gray-400 text-xs">1d ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account created</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <Link to="/dashboard/analytics">
                      <Button variant="ghost" className="w-full mt-3 text-brand-600 hover:text-brand-700">
                        View All Activity
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chrome Extension Integration */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-brand-600" />
                <span>Chrome Extension Integration</span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                Connected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  Use MailoReply directly in Gmail, Outlook, and other email clients
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Generate emails and replies without leaving your inbox
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Bot className="mr-2 h-4 w-4" />
                  Open Extension
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}