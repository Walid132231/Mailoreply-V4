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
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users,
  Building2,
  Mail,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Activity,
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  lastActive: string;
  usageStats: {
    templatesCreated: number;
    templatesUsed: number;
    aiGenerations: number;
    timeSaved: number;
  };
  permissions: {
    canCreateTemplates: boolean;
    canShareTemplates: boolean;
    canUseAI: boolean;
    canViewAnalytics: boolean;
  };
}

interface CompanyTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdBy: string;
  createdAt: string;
  isShared: boolean;
  usageCount: number;
  sharedWith: string[];
}

interface CompanyAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalTemplates: number;
  sharedTemplates: number;
  totalAIGenerations: number;
  totalTimeSaved: number;
  averageUsagePerUser: number;
  topPerformers: Array<{
    userId: string;
    name: string;
    metric: string;
    value: number;
  }>;
}

const getCompanyUsers = (): CompanyUser[] => {
  const saved = localStorage.getItem('enterprise_company_users');
  if (saved) return JSON.parse(saved);
  
  const defaultUsers: CompanyUser[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@democorp.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-10',
      lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      usageStats: {
        templatesCreated: 15,
        templatesUsed: 156,
        aiGenerations: 89,
        timeSaved: 2340
      },
      permissions: {
        canCreateTemplates: true,
        canShareTemplates: true,
        canUseAI: true,
        canViewAnalytics: true
      }
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@democorp.com',
      role: 'user',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      usageStats: {
        templatesCreated: 8,
        templatesUsed: 234,
        aiGenerations: 67,
        timeSaved: 1890
      },
      permissions: {
        canCreateTemplates: true,
        canShareTemplates: true,
        canUseAI: true,
        canViewAnalytics: false
      }
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@democorp.com',
      role: 'user',
      status: 'active',
      joinedAt: '2024-01-20',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      usageStats: {
        templatesCreated: 3,
        templatesUsed: 89,
        aiGenerations: 34,
        timeSaved: 890
      },
      permissions: {
        canCreateTemplates: true,
        canShareTemplates: false,
        canUseAI: true,
        canViewAnalytics: false
      }
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma.wilson@democorp.com',
      role: 'user',
      status: 'pending',
      joinedAt: '2024-01-25',
      lastActive: '',
      usageStats: {
        templatesCreated: 0,
        templatesUsed: 0,
        aiGenerations: 0,
        timeSaved: 0
      },
      permissions: {
        canCreateTemplates: true,
        canShareTemplates: false,
        canUseAI: true,
        canViewAnalytics: false
      }
    }
  ];
  
  localStorage.setItem('enterprise_company_users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

const getCompanyAnalytics = (): CompanyAnalytics => {
  return {
    totalUsers: 4,
    activeUsers: 3,
    totalTemplates: 26,
    sharedTemplates: 18,
    totalAIGenerations: 190,
    totalTimeSaved: 5120,
    averageUsagePerUser: 63.3,
    topPerformers: [
      { userId: '2', name: 'Sarah Johnson', metric: 'Templates Used', value: 234 },
      { userId: '1', name: 'John Smith', metric: 'Templates Created', value: 15 },
      { userId: '1', name: 'John Smith', metric: 'AI Generations', value: 89 }
    ]
  };
};

export default function EnterpriseAdmin() {
  const { user } = useAuth();
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>(getCompanyUsers());
  const [analytics, setAnalytics] = useState<CompanyAnalytics>(getCompanyAnalytics());
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastActiveText = (lastActive: string) => {
    if (!lastActive) return 'Never';
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const inviteUser = () => {
    if (!inviteEmail) return;
    
    const newUser: CompanyUser = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: 'user',
      status: 'pending',
      joinedAt: new Date().toISOString(),
      lastActive: '',
      usageStats: {
        templatesCreated: 0,
        templatesUsed: 0,
        aiGenerations: 0,
        timeSaved: 0
      },
      permissions: {
        canCreateTemplates: true,
        canShareTemplates: false,
        canUseAI: true,
        canViewAnalytics: false
      }
    };
    
    setCompanyUsers(prev => [...prev, newUser]);
    setInviteEmail('');
    setIsInviteDialogOpen(false);
  };

  const updateUserPermissions = (userId: string, permissions: Partial<CompanyUser['permissions']>) => {
    setCompanyUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, permissions: { ...user.permissions, ...permissions } }
        : user
    ));
  };

  const updateUserRole = (userId: string, role: 'user' | 'admin') => {
    setCompanyUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role } : user
    ));
  };

  const removeUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user from your company?')) {
      setCompanyUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  if (user?.role !== 'enterprise_admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view enterprise admin features.</p>
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
              <Building2 className="mr-3 h-8 w-8 text-orange-600" />
              {user.companyName} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your team's email productivity and templates.
            </p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your company on MailoReply AI.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={inviteUser} disabled={!inviteEmail}>
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Team Members</TabsTrigger>
            <TabsTrigger value="templates">Shared Templates</TabsTrigger>
            <TabsTrigger value="settings">Company Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.activeUsers} active this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Templates</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalTemplates}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.sharedTemplates} shared across team
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAIGenerations}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.averageUsagePerUser.toFixed(1)} per user average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(analytics.totalTimeSaved)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across entire team
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Team members leading in productivity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={`${performer.userId}-${performer.metric}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{performer.name}</p>
                          <p className="text-xs text-gray-500">{performer.metric}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{performer.value}</p>
                        <p className="text-xs text-gray-500">this month</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({companyUsers.length})</CardTitle>
                <CardDescription>
                  Manage your team's access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyUsers.map((companyUser) => (
                    <div key={companyUser.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-sm">
                              {companyUser.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center space-x-2">
                              <span>{companyUser.name}</span>
                              {companyUser.role === 'admin' && (
                                <Crown className="h-4 w-4 text-yellow-600" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{companyUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(companyUser.status)}>
                            {companyUser.status}
                          </Badge>
                          <Select
                            value={companyUser.role}
                            onValueChange={(value: 'user' | 'admin') => updateUserRole(companyUser.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeUser(companyUser.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Templates Created:</span>
                          <div className="font-medium">{companyUser.usageStats.templatesCreated}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Templates Used:</span>
                          <div className="font-medium">{companyUser.usageStats.templatesUsed}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">AI Generations:</span>
                          <div className="font-medium">{companyUser.usageStats.aiGenerations}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Active:</span>
                          <div className="font-medium">{getLastActiveText(companyUser.lastActive)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Permissions</h5>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Create Templates</span>
                            <Switch
                              checked={companyUser.permissions.canCreateTemplates}
                              onCheckedChange={(checked) => 
                                updateUserPermissions(companyUser.id, { canCreateTemplates: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Share Templates</span>
                            <Switch
                              checked={companyUser.permissions.canShareTemplates}
                              onCheckedChange={(checked) => 
                                updateUserPermissions(companyUser.id, { canShareTemplates: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Use AI</span>
                            <Switch
                              checked={companyUser.permissions.canUseAI}
                              onCheckedChange={(checked) => 
                                updateUserPermissions(companyUser.id, { canUseAI: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">View Analytics</span>
                            <Switch
                              checked={companyUser.permissions.canViewAnalytics}
                              onCheckedChange={(checked) => 
                                updateUserPermissions(companyUser.id, { canViewAnalytics: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shared Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shared Company Templates</CardTitle>
                <CardDescription>
                  Templates shared across your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Shared Templates</h3>
                  <p className="text-gray-600 mb-4">
                    Company-wide templates will be displayed here. Team members can create and share templates for everyone to use.
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Company Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Configure your organization's MailoReply AI settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={user.companyName} readOnly />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require template approval</Label>
                      <p className="text-sm text-gray-600">New templates need admin approval before sharing</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow external sharing</Label>
                      <p className="text-sm text-gray-600">Team members can share templates outside the company</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Usage analytics</Label>
                      <p className="text-sm text-gray-600">Collect usage analytics for reporting</p>
                    </div>
                    <Switch defaultChecked />
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
