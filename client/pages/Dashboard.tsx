import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Monitor
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UsageStatsCard, UsageIndicator } from '@/components/UsageIndicator';
import { getUserUsageStats } from '@/lib/usage-tracking';
import { isN8NConfigured } from '@/lib/n8n-service';
import { UsageStats } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';

export default function DashboardNew() {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUsageStats();
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const stats = await getUserUsageStats(user.id);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Generate Email',
        description: 'Create new emails with AI',
        icon: <Mail className="h-5 w-5" />,
        href: '/dashboard/ai-generator',
        color: 'bg-blue-500'
      },
      {
        title: 'Email Templates',
        description: 'Manage your templates',
        icon: <FileText className="h-5 w-5" />,
        href: '/dashboard/templates',
        color: 'bg-green-500'
      },
      {
        title: 'Usage Analytics',
        description: 'View detailed statistics',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/dashboard/analytics',
        color: 'bg-purple-500'
      }
    ];

    // Add role-specific actions
    if (user?.role === 'enterprise_manager') {
      baseActions.push({
        title: 'Team Management',
        description: 'Manage team members',
        icon: <Users className="h-5 w-5" />,
        href: '/dashboard/team',
        color: 'bg-orange-500'
      });
    }

    if (user?.role === 'superuser') {
      baseActions.push({
        title: 'Admin Panel',
        description: 'System administration',
        icon: <Shield className="h-5 w-5" />,
        href: '/dashboard/admin-settings',
        color: 'bg-red-500'
      });
    }

    return baseActions;
  };

  const getPlanInfo = () => {
    if (!user) return null;

    const planDetails = {
      free: {
        name: 'Free Plan',
        description: '3 emails per day, 30 per month',
        color: 'bg-gray-500'
      },
      pro: {
        name: 'Pro Plan',
        description: 'Unlimited daily, 100 per month',
        color: 'bg-blue-500'
      },
      pro_plus: {
        name: 'Pro Plus Plan',
        description: 'Unlimited emails',
        color: 'bg-purple-500'
      },
      enterprise_user: {
        name: 'Enterprise User',
        description: 'Unlimited emails',
        color: 'bg-green-500'
      },
      enterprise_manager: {
        name: 'Enterprise Manager',
        description: 'Unlimited emails + team management',
        color: 'bg-green-600'
      },
      superuser: {
        name: 'System Administrator',
        description: 'Full system access',
        color: 'bg-red-500'
      }
    };

    return planDetails[user.role] || planDetails.free;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const planInfo = getPlanInfo();
  const quickActions = getQuickActions();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back to your AI email assistant dashboard
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {planInfo && (
              <Badge className={`${planInfo.color} text-white`}>
                {planInfo.name}
              </Badge>
            )}
            

          </div>
        </div>

        {/* Usage Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Usage Stats */}
          <div className="lg:col-span-2">
            {usageStats && !loading ? (
              <UsageStatsCard usage={usageStats} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading usage stats...</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Your Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planInfo && (
                <>
                  <div>
                    <Badge className={`${planInfo.color} text-white mb-2`}>
                      {planInfo.name}
                    </Badge>
                    <p className="text-sm text-gray-600">{planInfo.description}</p>
                  </div>
                  
                  {usageStats && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Devices</span>
                        <span className="font-medium">
                          {usageStats.deviceCount} / {usageStats.deviceLimit === -1 ? '∞' : usageStats.deviceLimit}
                        </span>
                      </div>
                      
                      {!usageStats.isUnlimited && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Daily Usage</span>
                            <span className="font-medium">
                              {usageStats.dailyUsed} / {usageStats.dailyLimit}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Monthly Usage</span>
                            <span className="font-medium">
                              {usageStats.monthlyUsed} / {usageStats.monthlyLimit}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {user.role === 'free' && (
                    <Button size="sm" className="w-full">
                      Upgrade Plan
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Jump to your most-used features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {action.description}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">AI Generation Service</span>
                </div>
                <Badge variant="outline" className={isN8NConfigured ? "text-green-600 border-green-300" : "text-orange-600 border-orange-300"}>
                  {isN8NConfigured ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Template System</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Analytics</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 ${isN8NConfigured ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                  <span className="text-sm">Encryption Service</span>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageStats ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Usage</span>
                    <div className="flex items-center space-x-2">
                      <UsageIndicator usage={usageStats} type="daily" size={24} />
                      <span className="text-sm font-medium">
                        {usageStats.dailyLimit === -1 ? `${usageStats.dailyUsed} used` : `${usageStats.dailyUsed}/${usageStats.dailyLimit}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <div className="flex items-center space-x-2">
                      <UsageIndicator usage={usageStats} type="monthly" size={24} />
                      <span className="text-sm font-medium">
                        {usageStats.monthlyLimit === -1 ? `${usageStats.monthlyUsed} used` : `${usageStats.monthlyUsed}/${usageStats.monthlyLimit}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Devices</span>
                    <span className="text-sm font-medium">
                      {usageStats.deviceCount} / {usageStats.deviceLimit === -1 ? 'Unlimited' : usageStats.deviceLimit}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Link to="/dashboard/analytics">
                      <Button variant="outline" size="sm" className="w-full">
                        View Detailed Analytics
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-20">
                  <div className="text-sm text-gray-500">Loading stats...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started (for new users) */}
        {usageStats && usageStats.dailyUsed === 0 && usageStats.monthlyUsed === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <Bot className="h-5 w-5" />
                <span>Welcome to MailoReply AI!</span>
              </CardTitle>
              <CardDescription className="text-blue-700">
                Get started with AI-powered email generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-800">
                You haven't generated any emails yet. Here's how to get started:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <div className="font-medium text-blue-900">Try the AI Generator</div>
                    <div className="text-sm text-blue-700">Generate your first email or reply with AI assistance</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <div className="font-medium text-blue-900">Create Templates</div>
                    <div className="text-sm text-blue-700">Save commonly used emails as templates for quick access</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/dashboard/ai-generator">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="mr-2 h-4 w-4" />
                    Generate First Email
                  </Button>
                </Link>
                <Link to="/dashboard/templates">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <FileText className="mr-2 h-4 w-4" />
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
