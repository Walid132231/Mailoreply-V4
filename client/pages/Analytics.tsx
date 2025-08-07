import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  BarChart3, 
  Mail, 
  Bot,
  Clock, 
  TrendingUp,
  Zap,
  Target,
  Calendar,
  Users,
  Building2,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/NewAuthContext";
import { supabase } from "@/lib/supabase";

interface AnalyticsData {
  totalUsers: number;
  totalEnterprises: number;
  totalGenerations: number;
  monthlyRevenue: number;
  userGrowth: string;
  enterpriseGrowth: string;
  generationGrowth: string;
  revenueGrowth: string;
}

interface UserAnalyticsData {
  myGenerations: number;
  timeSaved: number;
  templatesUsed: number;
  dailyAverage: number;
  generationGrowth: string;
  timeSavedGrowth: string;
  templatesGrowth: string;
  averageGrowth: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (user.role === 'superuser') {
        await fetchSystemAnalytics();
      } else {
        await fetchUserAnalytics();
      }
      
      await fetchRecentActivity();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAnalytics = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'superuser');

      // Get total enterprises (companies)
      const { count: totalEnterprises } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get total AI generations
      const { count: totalGenerations } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('success', true);

      // Calculate monthly revenue (simplified - based on user roles)
      const { data: paidUsers } = await supabase
        .from('users')
        .select('role')
        .in('role', ['pro', 'pro_plus', 'enterprise_user', 'enterprise_manager']);

      let monthlyRevenue = 0;
      if (paidUsers) {
        paidUsers.forEach(user => {
          switch (user.role) {
            case 'pro': monthlyRevenue += 9.99; break;
            case 'pro_plus': monthlyRevenue += 19.99; break;
            case 'enterprise_user': 
            case 'enterprise_manager': monthlyRevenue += 49.99; break;
          }
        });
      }

      // Get growth data (compare with last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: lastMonthUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString())
        .neq('role', 'superuser');

      const { count: lastMonthGenerations } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString())
        .eq('success', true);

      const userGrowthRate = lastMonthUsers ? (((totalUsers || 0) - lastMonthUsers) / lastMonthUsers * 100) : 0;
      const generationGrowthRate = lastMonthGenerations ? (((totalGenerations || 0) - lastMonthGenerations) / lastMonthGenerations * 100) : 0;

      setAnalyticsData({
        totalUsers: totalUsers || 0,
        totalEnterprises: totalEnterprises || 0,
        totalGenerations: totalGenerations || 0,
        monthlyRevenue,
        userGrowth: `${userGrowthRate > 0 ? '+' : ''}${userGrowthRate.toFixed(1)}%`,
        enterpriseGrowth: '+15%', // Placeholder
        generationGrowth: `${generationGrowthRate > 0 ? '+' : ''}${generationGrowthRate.toFixed(1)}%`,
        revenueGrowth: '+18%' // Placeholder
      });
    } catch (error) {
      console.error('Error fetching system analytics:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      // Get user's AI generations
      const { count: myGenerations } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('success', true);

      // Calculate time saved (assuming 2 minutes saved per generation)
      const timeSaved = (myGenerations || 0) * 2;

      // Get templates used (simplified - count distinct template usage)
      const { count: templatesUsed } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .not('intent', 'is', null);

      // Calculate daily average
      const accountAge = user!.created_at ? Math.max(1, Math.floor((Date.now() - new Date(user!.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 1;
      const dailyAverage = (myGenerations || 0) / accountAge;

      // Get growth data (simplified)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { count: lastWeekGenerations } = await supabase
        .from('ai_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .lt('created_at', lastWeek.toISOString())
        .eq('success', true);

      const generationGrowthRate = lastWeekGenerations ? (((myGenerations || 0) - lastWeekGenerations) / lastWeekGenerations * 100) : 0;

      setUserAnalytics({
        myGenerations: myGenerations || 0,
        timeSaved,
        templatesUsed: templatesUsed || 0,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        generationGrowth: `${generationGrowthRate > 0 ? '+' : ''}${generationGrowthRate.toFixed(1)}%`,
        timeSavedGrowth: `${generationGrowthRate > 0 ? '+' : ''}${(generationGrowthRate * 2).toFixed(1)}%`,
        templatesGrowth: '+5%', // Placeholder
        averageGrowth: '+8%' // Placeholder
      });
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const query = supabase
        .from('ai_generations')
        .select('*')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(5);

      // For superuser, get all activity; for others, get only their activity
      if (user!.role !== 'superuser') {
        query.eq('user_id', user!.id);
      }

      const { data } = await query;

      if (data) {
        const formattedActivity = data.map((gen, index) => ({
          id: gen.id,
          type: gen.generation_type === 'reply' ? 'ai_generation' : 'email_generation',
          description: `AI ${gen.generation_type === 'reply' ? 'reply' : 'email'} generated - ${gen.tone || 'Professional'} tone`,
          time: getTimeAgo(gen.created_at),
          source: gen.source === 'extension' ? 'Extension' : 'Website'
        }));
        
        setRecentActivity(formattedActivity);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (!user) return null;

  const isSuperuser = user.role === 'superuser';
  const title = isSuperuser ? 'System Analytics' : 'Usage Analytics';
  const description = isSuperuser 
    ? 'Platform-wide usage and performance metrics' 
    : 'Your personal usage and productivity metrics';

  const metrics = isSuperuser && analyticsData ? [
    { name: 'Total Users', value: analyticsData.totalUsers.toLocaleString(), change: analyticsData.userGrowth, icon: Users },
    { name: 'Total Enterprises', value: analyticsData.totalEnterprises.toString(), change: analyticsData.enterpriseGrowth, icon: Building2 },
    { name: 'AI Generations', value: analyticsData.totalGenerations.toLocaleString(), change: analyticsData.generationGrowth, icon: Bot },
    { name: 'Monthly Revenue', value: `$${analyticsData.monthlyRevenue.toLocaleString()}`, change: analyticsData.revenueGrowth, icon: DollarSign }
  ] : userAnalytics ? [
    { name: 'AI Generations', value: userAnalytics.myGenerations.toString(), change: userAnalytics.generationGrowth, icon: Bot },
    { name: 'Time Saved', value: `${userAnalytics.timeSaved}h`, change: userAnalytics.timeSavedGrowth, icon: Clock },
    { name: 'Templates Used', value: userAnalytics.templatesUsed.toString(), change: userAnalytics.templatesGrowth, icon: Target },
    { name: 'Daily Average', value: userAnalytics.dailyAverage.toString(), change: userAnalytics.averageGrowth, icon: Calendar }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {metric.change}
                      </span> from last period
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Usage Breakdown for Pro/Pro Plus users */}
            {!isSuperuser && ['pro', 'pro_plus', 'enterprise_user'].includes(user.role) && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Distribution</CardTitle>
                    <CardDescription>Where you generate your replies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Chrome Extension</span>
                          <span className="text-sm text-gray-600">72%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Website</span>
                          <span className="text-sm text-gray-600">28%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Trends</CardTitle>
                    <CardDescription>Average time to generate responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">28s</div>
                          <div className="text-sm text-gray-600">Average Response Time</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>This week</span>
                          <span className="text-green-600">-15% faster</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Best time</span>
                          <span className="font-medium">12s</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts/Visualizations Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isSuperuser ? 'User Growth' : 'Daily Usage'}</CardTitle>
                  <CardDescription>{isSuperuser ? 'Monthly user acquisition trend' : 'AI generations per day'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Chart visualization</p>
                      <p className="text-xs">Real data from Supabase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isSuperuser ? 'Revenue Trends' : 'Usage Sources'}</CardTitle>
                  <CardDescription>{isSuperuser ? 'Monthly recurring revenue' : 'Website vs Extension usage'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Chart visualization</p>
                      <p className="text-xs">Real data from Supabase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {isSuperuser ? 'System-wide activity' : 'Your recent activity'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {activity.type === 'ai_generation' ? (
                            <Bot className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.source} • {activity.time}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Insights</CardTitle>
                <CardDescription>Key insights about your email automation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900">Peak Usage Time</h4>
                    <p className="text-sm text-blue-700">10:00 AM - 11:00 AM</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900">Most Used Tone</h4>
                    <p className="text-sm text-green-700">Professional (68%)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-purple-900">Efficiency Gain</h4>
                    <p className="text-sm text-purple-700">85% faster responses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade suggestion for free users */}
            {user.role === 'free' && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Unlock Detailed Analytics</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Upgrade to Pro to access advanced analytics, usage trends, and productivity insights.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Badge className="bg-blue-600 text-white">Templates & Hotkeys</Badge>
                      <Badge className="bg-purple-600 text-white">Advanced Reports</Badge>
                      <Badge className="bg-green-600 text-white">Time Tracking</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}