import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Crown,
  Globe,
  Chrome,
  Smartphone,
  Infinity,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UsageStatsCard, UsageIndicator, CompactUsageIndicator } from '@/components/UsageIndicator';
import { getUserUsageStats, canUserGenerate } from '@/lib/usage-tracking';
import { isN8NConfigured } from '@/lib/n8n-service';
import { UsageStats } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';

// Enhanced usage stats type with extension tracking
interface EnhancedUsageStats extends UsageStats {
  websiteUsage: number;
  extensionUsage: number;
  todayWebsiteUsage: number;
  todayExtensionUsage: number;
  recentGenerations?: Array<{
    id: string;
    source: 'website' | 'extension';
    generation_type: 'email' | 'reply';
    created_at: string;
    success: boolean;
  }>;
}

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<EnhancedUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canGenerate, setCanGenerate] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [stats, generatePermission] = await Promise.all([
        getUserUsageStats(user.id),
        canUserGenerate(user.id)
      ]);
      
      // Enhance stats with mock extension data (in real app, this would come from Supabase)
      const enhancedStats = stats ? {
        ...stats,
        websiteUsage: Math.floor(stats.monthlyUsed * 0.6),
        extensionUsage: Math.floor(stats.monthlyUsed * 0.4),
        todayWebsiteUsage: Math.floor(stats.dailyUsed * 0.7),
        todayExtensionUsage: Math.floor(stats.dailyUsed * 0.3),
        recentGenerations: [
          { id: '1', source: 'website' as const, generation_type: 'email' as const, created_at: new Date().toISOString(), success: true },
          { id: '2', source: 'extension' as const, generation_type: 'reply' as const, created_at: new Date().toISOString(), success: true }
        ]
      } : null;
      
      setUsageStats(enhancedStats);
      setCanGenerate(generatePermission);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificContent = () => {
    if (!user) return null;

    const roleConfigs = {
      superuser: {
        title: 'System Administrator Dashboard',
        subtitle: 'Complete system control and monitoring',
        color: 'from-red-500 to-red-600',
        icon: <Crown className="h-8 w-8" />,
        features: ['Unlimited Everything', 'System Management', 'User Administration', 'Analytics Access']
      },
      enterprise_manager: {
        title: 'Enterprise Manager Dashboard',
        subtitle: 'Team management and unlimited usage',
        color: 'from-purple-500 to-purple-600',
        icon: <Users className="h-8 w-8" />,
        features: ['Unlimited Usage', 'Team Management', '1 Device', 'Priority Support']
      },
      enterprise_user: {
        title: 'Enterprise User Dashboard',
        subtitle: 'Unlimited AI-powered email generation',
        color: 'from-green-500 to-green-600',
        icon: <Shield className="h-8 w-8" />,
        features: ['Unlimited Usage', '1 Device', 'Enterprise Support', 'Advanced Features']
      },
      pro_plus: {
        title: 'Pro Plus Dashboard',
        subtitle: 'Maximum flexibility with multi-device access',
        color: 'from-purple-400 to-indigo-600',
        icon: <Star className="h-8 w-8" />,
        features: ['Unlimited Usage', '2 Devices', 'Priority Support', 'Advanced Templates']
      },
      pro: {
        title: 'Pro Dashboard',
        subtitle: 'Professional email generation with higher limits',
        color: 'from-blue-500 to-blue-600',
        icon: <Zap className="h-8 w-8" />,
        features: ['Unlimited Daily', '100/Month', '1 Device', 'Pro Features']
      },
      free: {
        title: 'Free Dashboard',
        subtitle: 'Get started with AI email generation',
        color: 'from-gray-500 to-gray-600',
        icon: <Mail className="h-8 w-8" />,
        features: ['3 Daily', '30 Monthly', '1 Device', 'Basic Features']
      }
    };

    return roleConfigs[user.role as keyof typeof roleConfigs] || roleConfigs.free;
  };

  const getUsageLimitStatus = () => {
    if (!usageStats) return null;
    
    const isUnlimited = usageStats.isUnlimited;
    const dailyUsed = usageStats.dailyUsed;
    const monthlyUsed = usageStats.monthlyUsed;
    const dailyLimit = usageStats.dailyLimit;
    const monthlyLimit = usageStats.monthlyLimit;

    if (isUnlimited) {
      return {
        status: 'unlimited',
        message: 'Unlimited usage available',
        color: 'text-green-600',
        icon: <Infinity className="h-5 w-5 text-green-600" />
      };
    }

    if (!canGenerate) {
      return {
        status: 'blocked',
        message: 'Daily or monthly limit reached',
        color: 'text-red-600', 
        icon: <AlertCircle className="h-5 w-5 text-red-600" />
      };
    }

    const dailyRemaining = dailyLimit - dailyUsed;
    const monthlyRemaining = monthlyLimit - monthlyUsed;
    
    return {
      status: 'active',
      message: `${Math.min(dailyRemaining, monthlyRemaining)} generations remaining`,
      color: 'text-blue-600',
      icon: <CheckCircle className="h-5 w-5 text-blue-600" />
    };
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

  const roleConfig = getRoleSpecificContent();
  const usageStatus = getUsageLimitStatus();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        
        {/* Role-Specific Header */}
        <div className={`rounded-xl bg-gradient-to-r ${roleConfig?.color} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {roleConfig?.icon}
              <div>
                <h1 className="text-2xl font-bold">{roleConfig?.title}</h1>
                <p className="text-white/90">{roleConfig?.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/90 text-sm">Welcome back,</div>
              <div className="text-xl font-semibold">{user.name}</div>
            </div>
          </div>
          
          {/* Role Features */}
          <div className="mt-4 flex flex-wrap gap-2">
            {roleConfig?.features.map((feature, index) => (
              <span key={index} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Usage Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Usage Status</CardTitle>
            </CardHeader>
            <CardContent>
              {usageStatus && (
                <div className="flex items-center space-x-2">
                  {usageStatus.icon}
                  <div>
                    <div className={`font-medium ${usageStatus.color}`}>
                      {usageStatus.status === 'unlimited' ? 'Unlimited' : 
                       usageStatus.status === 'blocked' ? 'Limit Reached' : 'Active'}
                    </div>
                    <div className="text-sm text-gray-500">{usageStatus.message}</div>
                  </div>
                </div>
              )}
              
              {!usageStats?.isUnlimited && usageStats && (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily: {usageStats.dailyUsed}/{usageStats.dailyLimit}</span>
                      <span>{Math.max(0, usageStats.dailyLimit - usageStats.dailyUsed)} left</span>
                    </div>
                    <Progress value={(usageStats.dailyUsed / usageStats.dailyLimit) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly: {usageStats.monthlyUsed}/{usageStats.monthlyLimit}</span>
                      <span>{Math.max(0, usageStats.monthlyLimit - usageStats.monthlyUsed)} left</span>
                    </div>
                    <Progress value={(usageStats.monthlyUsed / usageStats.monthlyLimit) * 100} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Website vs Extension Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Usage Sources</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageStats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Website</span>
                    </div>
                    <div className="text-sm font-medium">
                      {usageStats.todayWebsiteUsage} today
                    </div>
                  </div>
                  <Progress value={(usageStats.websiteUsage / Math.max(1, usageStats.monthlyUsed)) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Chrome className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Extension</span>
                    </div>
                    <div className="text-sm font-medium">
                      {usageStats.todayExtensionUsage} today
                    </div>
                  </div>
                  <Progress value={(usageStats.extensionUsage / Math.max(1, usageStats.monthlyUsed)) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Devices</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageStats && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active Devices</span>
                    <span className="font-medium">
                      {usageStats.deviceCount} / {usageStats.deviceLimit === -1 ? '∞' : usageStats.deviceLimit}
                    </span>
                  </div>
                  <Progress 
                    value={usageStats.deviceLimit === -1 ? 100 : (usageStats.deviceCount / usageStats.deviceLimit) * 100} 
                    className="h-2"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {usageStats.deviceLimit === -1 ? 'Unlimited devices' : 
                     usageStats.deviceCount >= usageStats.deviceLimit ? 'Device limit reached' :
                     `${usageStats.deviceLimit - usageStats.deviceCount} more devices allowed`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/dashboard/ai-generator">
                <Button 
                  disabled={!canGenerate} 
                  className="w-full justify-start" 
                  variant={canGenerate ? "default" : "outline"}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  New Email
                </Button>
              </Link>
              <Link to="/dashboard/ai-generator?type=reply">
                <Button 
                  disabled={!canGenerate} 
                  className="w-full justify-start" 
                  variant="outline"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Reply Email
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Extension Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Chrome className="h-6 w-6 text-blue-600" />
              <span>Chrome Extension Integration</span>
            </CardTitle>
            <CardDescription>
              Use MailoReply AI directly in your email client for seamless integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Chrome className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Extension Usage</div>
                  <div className="text-sm text-gray-500">
                    {usageStats ? `${usageStats.extensionUsage} emails this month` : 'No usage yet'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Unified Tracking</div>
                  <div className="text-sm text-gray-500">
                    Extension & website usage combined
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Same Limits Apply</div>
                  <div className="text-sm text-gray-500">
                    Both sources count toward your {usageStats?.isUnlimited ? 'unlimited' : 'daily/monthly'} limits
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Generations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest email generations</CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats?.recentGenerations?.length ? (
                <div className="space-y-3">
                  {usageStats.recentGenerations.map((gen) => (
                    <div key={gen.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {gen.source === 'website' ? (
                          <Globe className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Chrome className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {gen.generation_type === 'email' ? 'New Email' : 'Email Reply'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {gen.source === 'website' ? 'Web Dashboard' : 'Chrome Extension'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(gen.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-500">No recent activity</div>
                  <div className="text-sm text-gray-400">Start generating emails to see your activity here</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status & Upgrade */}
          <Card>
            <CardHeader>
              <CardTitle>System Status & Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">AI Generation</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Chrome Extension</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">Active</Badge>
                </div>
              </div>

              {/* Upgrade Section for Free Users */}
              {user.role === 'free' && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Upgrade Your Account</div>
                  <div className="text-xs text-gray-500 mb-3">
                    Get unlimited daily usage and advanced features
                  </div>
                  <div className="space-y-2">
                    <Link to="/dashboard/subscription">
                      <Button size="sm" className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Role-Specific Actions */}
              {(user.role === 'enterprise_manager' || user.role === 'superuser') && (
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    {user.role === 'enterprise_manager' && (
                      <Link to="/dashboard/team">
                        <Button variant="outline" size="sm" className="w-full">
                          <Users className="h-4 w-4 mr-2" />
                          Manage Team
                        </Button>
                      </Link>
                    )}
                    {user.role === 'superuser' && (
                      <Link to="/dashboard/admin-settings">
                        <Button variant="outline" size="sm" className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}