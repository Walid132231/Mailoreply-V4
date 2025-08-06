import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users,
  Activity,
  TrendingUp,
  Mail,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Database,
  Server,
  Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PressureMonitor from "@/components/PressureMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAIGenerations: number;
  totalTemplates: number;
  avgResponseTime: number;
  uptime: number;
  errorRate: number;
  systemLoad: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'ai_generation' | 'template_created' | 'template_used' | 'login' | 'error';
}

interface PlanDistribution {
  free: number;
  pro: number;
  pro_plus: number;
  enterprise: number;
}

const getSystemStats = (): SystemStats => {
  return {
    totalUsers: 1247,
    activeUsers: 234,
    totalAIGenerations: 15678,
    totalTemplates: 3456,
    avgResponseTime: 245,
    uptime: 99.9,
    errorRate: 0.2,
    systemLoad: 67
  };
};

const getRecentActivity = (): UserActivity[] => {
  const activities = [
    {
      id: '1',
      userId: 'user_123',
      userName: 'John Doe',
      userEmail: 'john@company.com',
      action: 'AI Reply Generated',
      details: 'Professional tone, Follow-up intent',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      type: 'ai_generation' as const
    },
    {
      id: '2',
      userId: 'user_456',
      userName: 'Sarah Wilson',
      userEmail: 'sarah@startup.io',
      action: 'Template Created',
      details: 'Meeting Confirmation template',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      type: 'template_created' as const
    },
    {
      id: '3',
      userId: 'user_789',
      userName: 'Mike Chen',
      userEmail: 'mike@enterprise.com',
      action: 'Template Used',
      details: 'Quick Response via Ctrl+3',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      type: 'template_used' as const
    },
    {
      id: '4',
      userId: 'user_321',
      userName: 'Emma Davis',
      userEmail: 'emma@agency.co',
      action: 'User Login',
      details: 'Chrome extension authentication',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      type: 'login' as const
    },
    {
      id: '5',
      userId: 'user_654',
      userName: 'Alex Rodriguez',
      userEmail: 'alex@tech.com',
      action: 'API Error',
      details: 'Rate limit exceeded for AI generation',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: 'error' as const
    }
  ];
  
  return activities;
};

const getPlanDistribution = (): PlanDistribution => {
  return {
    free: 867,
    pro: 234,
    pro_plus: 98,
    enterprise: 48
  };
};

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>(getSystemStats());
  const [activities, setActivities] = useState<UserActivity[]>(getRecentActivity());
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution>(getPlanDistribution());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small changes in stats
      setStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        totalAIGenerations: prev.totalAIGenerations + Math.floor(Math.random() * 3),
        avgResponseTime: prev.avgResponseTime + Math.floor(Math.random() * 20) - 10,
        systemLoad: Math.max(20, Math.min(90, prev.systemLoad + Math.floor(Math.random() * 10) - 5))
      }));
      
      // Simulate new activity
      if (Math.random() < 0.3) {
        const newActivity: UserActivity = {
          id: Date.now().toString(),
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          userName: `User ${Math.floor(Math.random() * 100)}`,
          userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
          action: ['AI Reply Generated', 'Template Used', 'User Login'][Math.floor(Math.random() * 3)],
          details: 'Real-time activity simulation',
          timestamp: new Date().toISOString(),
          type: ['ai_generation', 'template_used', 'login'][Math.floor(Math.random() * 3)] as any
        };
        
        setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      }
      
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats(getSystemStats());
    setActivities(getRecentActivity());
    setPlanDistribution(getPlanDistribution());
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'ai_generation': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'template_created': return <Mail className="h-4 w-4 text-green-600" />;
      case 'template_used': return <Activity className="h-4 w-4 text-purple-600" />;
      case 'login': return <Users className="h-4 w-4 text-gray-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (value: number, type: 'uptime' | 'error' | 'load') => {
    switch (type) {
      case 'uptime':
        return value >= 99 ? 'text-green-600' : value >= 95 ? 'text-yellow-600' : 'text-red-600';
      case 'error':
        return value <= 1 ? 'text-green-600' : value <= 5 ? 'text-yellow-600' : 'text-red-600';
      case 'load':
        return value <= 60 ? 'text-green-600' : value <= 80 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view admin analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
            <p className="text-gray-600 mt-1">
              Real-time insights into user activity and system performance.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="pressure">Pressure Monitor</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(stats.uptime, 'uptime')}`}>
                {stats.uptime}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.uptime >= 99 ? 'Excellent' : stats.uptime >= 95 ? 'Good' : 'Needs Attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgResponseTime}ms
              </div>
              <p className="text-xs text-muted-foreground">
                API response latency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(stats.errorRate, 'error')}`}>
                {stats.errorRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Load</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(stats.systemLoad, 'load')}`}>
                {stats.systemLoad}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    stats.systemLoad <= 60 ? 'bg-green-600' : 
                    stats.systemLoad <= 80 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${stats.systemLoad}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAIGenerations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates Created</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTemplates.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>User subscription breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Free</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{planDistribution.free}</div>
                    <div className="text-xs text-gray-500">
                      {((planDistribution.free / stats.totalUsers) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                    <span className="text-sm">Pro</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{planDistribution.pro}</div>
                    <div className="text-xs text-gray-500">
                      {((planDistribution.pro / stats.totalUsers) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Pro Plus</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{planDistribution.pro_plus}</div>
                    <div className="text-xs text-gray-500">
                      {((planDistribution.pro_plus / stats.totalUsers) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Enterprise</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{planDistribution.enterprise}</div>
                    <div className="text-xs text-gray-500">
                      {((planDistribution.enterprise / stats.totalUsers) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Real-time Activity</CardTitle>
                  <CardDescription>Live user activity across the platform</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.userName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            </div>
          </TabsContent>

          <TabsContent value="pressure" className="space-y-6">
            <PressureMonitor />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Analytics</h3>
              <p className="text-gray-600">Advanced user analytics and behavior insights coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
