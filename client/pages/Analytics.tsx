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
  Building2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock analytics data based on user role
const getAnalyticsData = (userRole: string) => {
  switch (userRole) {
    case 'superuser':
      return {
        title: 'System Analytics',
        description: 'Platform-wide usage and performance metrics',
        metrics: [
          { name: 'Total Users', value: '1,247', change: '+12%', icon: Users },
          { name: 'Total Enterprises', value: '23', change: '+3', icon: Building2 },
          { name: 'AI Generations', value: '45,678', change: '+18%', icon: Bot },
          { name: 'Monthly Revenue', value: '$28,450', change: '+15%', icon: TrendingUp }
        ],
        charts: [
          { title: 'User Growth', data: 'Monthly user acquisition trend' },
          { title: 'Revenue Trends', data: 'Monthly recurring revenue' },
          { title: 'Usage by Plan', data: 'Free vs Pro vs Enterprise usage' },
          { title: 'Geographic Distribution', data: 'Users by region' }
        ]
      };

    case 'enterprise_manager':
      return {
        title: 'Team Analytics',
        description: 'Your team\'s usage and productivity metrics',
        metrics: [
          { name: 'Team Members', value: '25', change: '+2', icon: Users },
          { name: 'AI Generations', value: '1,250', change: '+8%', icon: Bot },
          { name: 'Shared Templates', value: '12', change: '+3', icon: Mail },
          { name: 'Time Saved', value: '78h', change: '+12%', icon: Clock }
        ],
        charts: [
          { title: 'Team Usage', data: 'Individual member usage' },
          { title: 'Template Usage', data: 'Most used shared templates' },
          { title: 'Daily Activity', data: 'Team activity by day' },
          { title: 'Productivity Trends', data: 'Time saved over time' }
        ]
      };

    default:
      return {
        title: 'Usage Analytics',
        description: 'Your personal usage and productivity metrics',
        metrics: [
          { name: 'AI Generations', value: userRole === 'pro_plus' ? '456' : userRole === 'pro' ? '234' : '23', change: '+12%', icon: Bot },
          { name: 'Time Saved', value: userRole === 'pro_plus' ? '114h' : userRole === 'pro' ? '58h' : '11h', change: '+8%', icon: Clock },
          { name: 'Templates Used', value: userRole === 'free' ? '0' : userRole === 'pro' ? '18' : '34', change: userRole === 'free' ? '+0' : '+15%', icon: Target },
          { name: 'Daily Average', value: userRole === 'pro_plus' ? '15.2' : userRole === 'pro' ? '7.8' : '2.3', change: '+5%', icon: Calendar }
        ],
        charts: [
          { title: 'Daily Usage', data: 'AI generations per day' },
          { title: 'Response Time', data: 'Average response time trend' },
          { title: 'Usage Sources', data: 'Website vs Extension usage' },
          { title: 'Monthly Trends', data: 'Usage patterns over time' }
        ]
      };
  }
};

const recentActivity = [
  {
    id: 1,
    type: 'ai_generation',
    description: 'AI reply generated - Professional tone',
    time: '5 minutes ago',
    source: 'Extension'
  },
  {
    id: 2,
    type: 'template_used',
    description: 'Used "Meeting Follow-up" template',
    time: '1 hour ago',
    source: 'Website'
  },
  {
    id: 3,
    type: 'ai_generation',
    description: 'AI reply generated - Friendly tone',
    time: '3 hours ago',
    source: 'Extension'
  },
  {
    id: 4,
    type: 'template_created',
    description: 'Created new template "Thank You Response"',
    time: '1 day ago',
    source: 'Website'
  },
];

export default function Analytics() {
  const { user } = useAuth();
  
  if (!user) return null;

  const analytics = getAnalyticsData(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{analytics.title}</h1>
          <p className="text-gray-600 mt-1">{analytics.description}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analytics.metrics.map((metric, index) => (
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
        {['pro', 'pro_plus', 'enterprise_user'].includes(user.role) && (
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
                      <div className="bg-brand-600 h-2 rounded-full" style={{ width: '72%' }}></div>
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
                      <div className="text-3xl font-bold text-brand-600">28s</div>
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
          {analytics.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
                <CardDescription>{chart.data}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Chart visualization</p>
                    <p className="text-xs">Connected to real data via Supabase</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {user.role === 'superuser' ? 'System-wide activity' : 
               user.role === 'enterprise_manager' ? 'Team activity' : 'Your recent activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    {activity.type === 'ai_generation' ? (
                      <Bot className="h-4 w-4 text-brand-600" />
                    ) : activity.type === 'template_used' ? (
                      <Target className="h-4 w-4 text-green-600" />
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
          <Card className="bg-gradient-to-r from-brand-50 to-purple-50 border-brand-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-brand-900 mb-2">Unlock Detailed Analytics</h3>
                <p className="text-brand-700 text-sm mb-4">
                  Upgrade to Pro to access advanced analytics, usage trends, and productivity insights.
                </p>
                <div className="flex justify-center space-x-3">
                  <Badge className="bg-brand-600 text-white">Templates & Hotkeys</Badge>
                  <Badge className="bg-purple-600 text-white">Advanced Reports</Badge>
                  <Badge className="bg-green-600 text-white">Time Tracking</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
