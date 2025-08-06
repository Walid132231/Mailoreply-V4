import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Crown,
  Building2,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Activity,
  Clock,
  Database,
  Server,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Zap,
  Mail,
  Send,
  UserPlus,
  Loader2
} from "lucide-react";

interface Enterprise {
  id: string;
  name: string;
  adminEmail: string;
  adminName: string;
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  plan: 'enterprise' | 'enterprise_plus';
  createdAt: string;
  userLimit: number;
  currentUsers: number;
  usageLimits: {
    aiGenerations: number;
    templatesLimit: number;
    storageGB: number;
  };
  billing: {
    monthlyRevenue: number;
    lastPayment: string;
    nextBilling: string;
  };
  usage: {
    totalAIGenerations: number;
    totalTemplates: number;
    totalUsers: number;
    storageUsed: number;
  };
  features: {
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
  };
}

interface SystemMetrics {
  totalEnterprises: number;
  totalEnterpriseUsers: number;
  monthlyRevenue: number;
  averageUsagePerEnterprise: number;
  topEnterprises: Array<{
    id: string;
    name: string;
    metric: string;
    value: number;
  }>;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  company_name: string;
  role: string;
  status: string;
  expires_at: string;
  invited_by_name: string;
  created_at: string;
}

interface InviteEnterpriseUser {
  name: string;
  email: string;
  companyName: string;
  plan: 'enterprise' | 'enterprise_plus';
  userLimit: number;
  role: 'enterprise_manager' | 'enterprise_user';
}

const getEnterprises = (): Enterprise[] => {
  const saved = localStorage.getItem('super_admin_enterprises');
  if (saved) return JSON.parse(saved);
  
  const defaultEnterprises: Enterprise[] = [
    {
      id: '1',
      name: 'Demo Corporation',
      adminEmail: 'enterprise@demo.com',
      adminName: 'Enterprise Admin',
      status: 'active',
      plan: 'enterprise',
      createdAt: '2024-01-10',
      userLimit: 50,
      currentUsers: 4,
      usageLimits: {
        aiGenerations: 2000,
        templatesLimit: 500,
        storageGB: 10
      },
      billing: {
        monthlyRevenue: 499,
        lastPayment: '2024-01-01',
        nextBilling: '2024-02-01'
      },
      usage: {
        totalAIGenerations: 390,
        totalTemplates: 26,
        totalUsers: 4,
        storageUsed: 2.3
      },
      features: {
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        advancedAnalytics: true,
        customIntegrations: false
      }
    },
    {
      id: '2',
      name: 'TechStart Inc',
      adminEmail: 'admin@techstart.com',
      adminName: 'Tech Admin',
      status: 'trial',
      plan: 'enterprise',
      createdAt: '2024-01-20',
      userLimit: 25,
      currentUsers: 8,
      usageLimits: {
        aiGenerations: 1000,
        templatesLimit: 200,
        storageGB: 5
      },
      billing: {
        monthlyRevenue: 0,
        lastPayment: '',
        nextBilling: '2024-02-20'
      },
      usage: {
        totalAIGenerations: 156,
        totalTemplates: 12,
        totalUsers: 8,
        storageUsed: 1.2
      },
      features: {
        customBranding: false,
        apiAccess: false,
        prioritySupport: true,
        advancedAnalytics: false,
        customIntegrations: false
      }
    },
    {
      id: '3',
      name: 'Global Marketing Agency',
      adminEmail: 'admin@globalmarketing.com',
      adminName: 'Marketing Director',
      status: 'active',
      plan: 'enterprise_plus',
      createdAt: '2023-12-15',
      userLimit: 100,
      currentUsers: 23,
      usageLimits: {
        aiGenerations: 5000,
        templatesLimit: 1000,
        storageGB: 25
      },
      billing: {
        monthlyRevenue: 999,
        lastPayment: '2024-01-01',
        nextBilling: '2024-02-01'
      },
      usage: {
        totalAIGenerations: 1234,
        totalTemplates: 89,
        totalUsers: 23,
        storageUsed: 8.7
      },
      features: {
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        advancedAnalytics: true,
        customIntegrations: true
      }
    }
  ];
  
  localStorage.setItem('super_admin_enterprises', JSON.stringify(defaultEnterprises));
  return defaultEnterprises;
};

const getSystemMetrics = (): SystemMetrics => {
  return {
    totalEnterprises: 3,
    totalEnterpriseUsers: 35,
    monthlyRevenue: 1498,
    averageUsagePerEnterprise: 593,
    topEnterprises: [
      { id: '3', name: 'Global Marketing Agency', metric: 'AI Generations', value: 1234 },
      { id: '1', name: 'Demo Corporation', metric: 'Monthly Revenue', value: 499 },
      { id: '3', name: 'Global Marketing Agency', metric: 'Team Size', value: 23 }
    ]
  };
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<Enterprise[]>(getEnterprises());
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(getSystemMetrics());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [newEnterprise, setNewEnterprise] = useState({
    name: '',
    adminEmail: '',
    adminName: '',
    userLimit: 25,
    plan: 'enterprise' as const,
    aiGenerations: 1000,
    templatesLimit: 200,
    storageGB: 5
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      case 'enterprise_plus': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createEnterprise = () => {
    const enterprise: Enterprise = {
      id: Date.now().toString(),
      name: newEnterprise.name,
      adminEmail: newEnterprise.adminEmail,
      adminName: newEnterprise.adminName,
      status: 'trial',
      plan: newEnterprise.plan,
      createdAt: new Date().toISOString(),
      userLimit: newEnterprise.userLimit,
      currentUsers: 0,
      usageLimits: {
        aiGenerations: newEnterprise.aiGenerations,
        templatesLimit: newEnterprise.templatesLimit,
        storageGB: newEnterprise.storageGB
      },
      billing: {
        monthlyRevenue: 0,
        lastPayment: '',
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      usage: {
        totalAIGenerations: 0,
        totalTemplates: 0,
        totalUsers: 0,
        storageUsed: 0
      },
      features: {
        customBranding: newEnterprise.plan === 'enterprise_plus',
        apiAccess: newEnterprise.plan === 'enterprise_plus',
        prioritySupport: true,
        advancedAnalytics: newEnterprise.plan === 'enterprise_plus',
        customIntegrations: newEnterprise.plan === 'enterprise_plus'
      }
    };

    setEnterprises(prev => [...prev, enterprise]);
    setNewEnterprise({
      name: '',
      adminEmail: '',
      adminName: '',
      userLimit: 25,
      plan: 'enterprise',
      aiGenerations: 1000,
      templatesLimit: 200,
      storageGB: 5
    });
    setIsCreateDialogOpen(false);
  };

  const updateEnterpriseStatus = (enterpriseId: string, status: Enterprise['status']) => {
    setEnterprises(prev => prev.map(enterprise => 
      enterprise.id === enterpriseId ? { ...enterprise, status } : enterprise
    ));
  };

  const deleteEnterprise = (enterpriseId: string) => {
    if (confirm('Are you sure you want to delete this enterprise? This action cannot be undone.')) {
      setEnterprises(prev => prev.filter(enterprise => enterprise.id !== enterpriseId));
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Admin Access Required</h2>
          <p className="text-gray-600">You don't have permission to view super admin features.</p>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Crown className="mr-3 h-8 w-8 text-yellow-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage enterprise customers and system-wide settings.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Enterprise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Enterprise</DialogTitle>
                <DialogDescription>
                  Set up a new enterprise customer with custom limits and features.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={newEnterprise.name}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select 
                      value={newEnterprise.plan}
                      onValueChange={(value: 'enterprise' | 'enterprise_plus') => 
                        setNewEnterprise(prev => ({ ...prev, plan: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise ($499/mo)</SelectItem>
                        <SelectItem value="enterprise_plus">Enterprise Plus ($999/mo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input
                      id="adminName"
                      value={newEnterprise.adminName}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, adminName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={newEnterprise.adminEmail}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userLimit">User Limit</Label>
                    <Input
                      id="userLimit"
                      type="number"
                      value={newEnterprise.userLimit}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, userLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="aiLimit">AI Generations/Month</Label>
                    <Input
                      id="aiLimit"
                      type="number"
                      value={newEnterprise.aiGenerations}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, aiGenerations: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templatesLimit">Templates Limit</Label>
                    <Input
                      id="templatesLimit"
                      type="number"
                      value={newEnterprise.templatesLimit}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, templatesLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="storageLimit">Storage (GB)</Label>
                    <Input
                      id="storageLimit"
                      type="number"
                      value={newEnterprise.storageGB}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, storageGB: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEnterprise} disabled={!newEnterprise.name || !newEnterprise.adminEmail}>
                    Create Enterprise
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enterprises">Enterprises</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enterprises</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.totalEnterprises}</div>
                  <p className="text-xs text-muted-foreground">
                    Active enterprise customers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enterprise Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.totalEnterpriseUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all enterprises
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${systemMetrics.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    From enterprise plans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics.averageUsagePerEnterprise}</div>
                  <p className="text-xs text-muted-foreground">
                    AI generations per enterprise
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Enterprises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Top Performing Enterprises
                </CardTitle>
                <CardDescription>
                  Leading enterprise customers by various metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.topEnterprises.map((enterprise, index) => (
                    <div key={`${enterprise.id}-${enterprise.metric}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{enterprise.name}</p>
                          <p className="text-xs text-gray-500">{enterprise.metric}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {enterprise.metric === 'Monthly Revenue' ? `$${enterprise.value}` : enterprise.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enterprises Tab */}
          <TabsContent value="enterprises" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Customers ({enterprises.length})</CardTitle>
                <CardDescription>
                  Manage all enterprise accounts and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enterprises.map((enterprise) => (
                    <div key={enterprise.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{enterprise.name}</h4>
                            <p className="text-sm text-gray-600">{enterprise.adminEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(enterprise.status)}>
                            {enterprise.status}
                          </Badge>
                          <Badge className={getPlanColor(enterprise.plan)}>
                            {enterprise.plan}
                          </Badge>
                          <Select
                            value={enterprise.status}
                            onValueChange={(value: Enterprise['status']) => 
                              updateEnterpriseStatus(enterprise.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEnterprise(enterprise.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Users:</span>
                          <div className="font-medium">{enterprise.currentUsers} / {enterprise.userLimit}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">AI Usage:</span>
                          <div className="font-medium">
                            {enterprise.usage.totalAIGenerations} / {enterprise.usageLimits.aiGenerations}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Templates:</span>
                          <div className="font-medium">
                            {enterprise.usage.totalTemplates} / {enterprise.usageLimits.templatesLimit}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <div className="font-medium">${enterprise.billing.monthlyRevenue}/mo</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className={`h-3 w-3 ${enterprise.features.customBranding ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Custom Branding</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className={`h-3 w-3 ${enterprise.features.apiAccess ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>API Access</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className={`h-3 w-3 ${enterprise.features.prioritySupport ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Priority Support</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className={`h-3 w-3 ${enterprise.features.advancedAnalytics ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Advanced Analytics</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className={`h-3 w-3 ${enterprise.features.customIntegrations ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>Custom Integrations</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise Analytics</h3>
              <p className="text-gray-600">
                Detailed analytics and reporting for all enterprise customers will be available here.
              </p>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Global system settings and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Enterprise Defaults</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Default User Limit</Label>
                        <Input type="number" defaultValue="25" />
                      </div>
                      <div>
                        <Label>Default AI Limit</Label>
                        <Input type="number" defaultValue="1000" />
                      </div>
                      <div>
                        <Label>Trial Duration (days)</Label>
                        <Input type="number" defaultValue="30" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-4">System Limits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Global rate limiting</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-scaling enabled</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maintenance mode</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
