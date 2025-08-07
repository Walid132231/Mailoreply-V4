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
import { supabase, supabaseServiceRole, isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase";
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

// Real Supabase functions
const getEnterprises = async (): Promise<Enterprise[]> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, returning mock data');
    return getDefaultEnterprises();
  }

  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        plan_type,
        max_users,
        current_users,
        created_at,
        users!inner(
          id,
          name,
          email,
          role
        )
      `)
      .eq('plan_type', 'enterprise');

    if (error) throw error;

    return companies?.map((company: any) => {
      const manager = company.users?.find((u: any) => u.role === 'enterprise_manager');
      
      return {
        id: company.id,
        name: company.name,
        adminEmail: manager?.email || 'No manager assigned',
        adminName: manager?.name || 'No manager assigned',
        status: 'active' as const,
        plan: company.plan_type,
        createdAt: new Date(company.created_at).toISOString().split('T')[0],
        userLimit: company.max_users || 50,
        currentUsers: company.current_users || 0,
        usageLimits: {
          aiGenerations: 10000,
          templatesLimit: 1000,
          storageGB: 100,
        },
        billing: {
          monthlyRevenue: company.plan_type === 'enterprise' ? 999 : 1999,
          lastPayment: '2024-01-01',
          nextBilling: '2024-02-01',
        },
        usage: {
          totalAIGenerations: Math.floor(Math.random() * 5000),
          totalTemplates: Math.floor(Math.random() * 500),
          totalUsers: company.current_users || 0,
          storageUsed: Math.floor(Math.random() * 50),
        },
        features: {
          customBranding: true,
          apiAccess: company.plan_type === 'enterprise_plus',
          prioritySupport: true,
          advancedAnalytics: company.plan_type === 'enterprise_plus',
          customIntegrations: company.plan_type === 'enterprise_plus',
        },
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching enterprises:', error);
    return getDefaultEnterprises();
  }
};

const getDefaultEnterprises = (): Enterprise[] => {
  return [
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
        storageGB: 50,
      },
      billing: {
        monthlyRevenue: 999.99,
        lastPayment: '2024-01-01',
        nextBilling: '2024-02-01',
      },
      usage: {
        totalAIGenerations: 1250,
        totalTemplates: 35,
        totalUsers: 4,
        storageUsed: 12.5,
      },
      features: {
        customBranding: true,
        apiAccess: false,
        prioritySupport: true,
        advancedAnalytics: false,
        customIntegrations: false,
      },
    },
  ];
};

const getPendingInvitations = async (): Promise<PendingInvitation[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        name,
        role,
        status,
        expires_at,
        created_at,
        companies!inner(name),
        users!inner(name)
      `)
      .eq('status', 'pending');

    if (error) throw error;

    return invitations?.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      company_name: invitation.companies?.name || 'Unknown Company',
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
      invited_by_name: invitation.users?.name || 'Unknown',
      created_at: invitation.created_at,
    })) || [];
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return [];
  }
};
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
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalEnterprises: 0,
    totalEnterpriseUsers: 0,
    monthlyRevenue: 0,
    averageUsagePerEnterprise: 0,
    topEnterprises: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create enterprise dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEnterprise, setNewEnterprise] = useState<InviteEnterpriseUser>({
    name: '',
    email: '',
    companyName: '',
    plan: 'enterprise',
    userLimit: 25,
    role: 'enterprise_manager'
  });

  // Invite user dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUser, setInviteUser] = useState({
    name: '',
    email: '',
    companyId: '',
    role: 'enterprise_user' as 'enterprise_manager' | 'enterprise_user'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enterprisesData, invitationsData] = await Promise.all([
        getEnterprises(),
        getPendingInvitations()
      ]);
      
      setEnterprises(enterprisesData);
      setPendingInvitations(invitationsData);
      
      // Calculate system metrics
      const totalEnterprises = enterprisesData.length;
      const totalUsers = enterprisesData.reduce((sum, e) => sum + e.currentUsers, 0);
      const totalRevenue = enterprisesData.reduce((sum, e) => sum + e.billing.monthlyRevenue, 0);
      const avgUsage = totalEnterprises > 0 ? totalUsers / totalEnterprises : 0;

      setSystemMetrics({
        totalEnterprises,
        totalEnterpriseUsers: totalUsers,
        monthlyRevenue: totalRevenue,
        averageUsagePerEnterprise: avgUsage,
        topEnterprises: enterprisesData
          .sort((a, b) => b.currentUsers - a.currentUsers)
          .slice(0, 5)
          .map(e => ({
            id: e.id,
            name: e.name,
            metric: 'users',
            value: e.currentUsers
          }))
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createEnterpriseWithManager = async () => {
    if (!newEnterprise.name || !newEnterprise.email || !newEnterprise.companyName) {
      setError('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      // Create company first
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: newEnterprise.companyName,
          plan_type: newEnterprise.plan,
          max_users: newEnterprise.userLimit,
          current_users: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create manager user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name: newEnterprise.name,
          email: newEnterprise.email,
          role: 'enterprise_manager',
          company_id: company.id,
          daily_limit: -1,
          monthly_limit: -1,
          device_limit: -1,
          status: 'pending'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Send invitation to the manager
      const { data: inviteResult, error: inviteError } = await supabase
        .rpc('invite_enterprise_user', {
          user_email: newEnterprise.email,
          user_name: newEnterprise.name,
          user_role: 'enterprise_manager',
          manager_user_id: user?.id
        });

      if (inviteError) throw inviteError;

      if (!inviteResult.success) {
        throw new Error(inviteResult.error || 'Failed to send invitation');
      }

      setSuccess(`Enterprise "${newEnterprise.companyName}" created and invitation sent to ${newEnterprise.email}`);
      setIsCreateDialogOpen(false);
      setNewEnterprise({
        name: '',
        email: '',
        companyName: '',
        plan: 'enterprise',
        userLimit: 25,
        role: 'enterprise_manager'
      });
      
      // Reload data
      loadData();
    } catch (error: any) {
      console.error('Error creating enterprise:', error);
      setError(error.message || 'Failed to create enterprise');
    } finally {
      setCreateLoading(false);
    }
  };

  const inviteEnterpriseUser = async () => {
    if (!inviteUser.name || !inviteUser.email || !inviteUser.companyId) {
      setError('Please fill in all required fields');
      return;
    }

    setInviteLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      // Send invitation
      const { data: result, error } = await supabase
        .rpc('invite_enterprise_user', {
          user_email: inviteUser.email,
          user_name: inviteUser.name,
          user_role: inviteUser.role,
          manager_user_id: user?.id
        });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      setSuccess(`Invitation sent to ${inviteUser.email}`);
      setIsInviteDialogOpen(false);
      setInviteUser({
        name: '',
        email: '',
        companyId: '',
        role: 'enterprise_user'
      });
      
      // Reload pending invitations
      const invitations = await getPendingInvitations();
      setPendingInvitations(invitations);
    } catch (error: any) {
      console.error('Error inviting user:', error);
      setError(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('user_invitations')
        .select('email, name, role')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      // Send new invitation
      const { data: result, error: inviteError } = await supabase
        .rpc('invite_enterprise_user', {
          user_email: invitation.email,
          user_name: invitation.name,
          user_role: invitation.role,
          manager_user_id: user?.id
        });

      if (inviteError) throw inviteError;

      if (result.success) {
        setSuccess('Invitation resent successfully');
        loadData(); // Reload to update invitation data
      } else {
        setError(result.error || 'Failed to resend invitation');
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      setError(error.message || 'Failed to resend invitation');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      setSuccess('Invitation cancelled');
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      setError(error.message || 'Failed to cancel invitation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
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
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={newEnterprise.companyName}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, companyName: e.target.value }))}
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
                        <SelectItem value="enterprise">Enterprise ($99/month)</SelectItem>
                        <SelectItem value="enterprise_plus">Enterprise Plus ($199/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input
                      id="adminName"
                      value={newEnterprise.name}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={newEnterprise.email}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="userLimit">User Limit</Label>
                  <Input
                    id="userLimit"
                    type="number"
                    value={newEnterprise.userLimit}
                    onChange={(e) => setNewEnterprise(prev => ({ ...prev, userLimit: parseInt(e.target.value) || 25 }))}
                    min="1"
                    max="1000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum number of users allowed in this enterprise
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEnterpriseWithManager} disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Create Enterprise
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enterprises">Enterprises</TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
              {pendingInvitations.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
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

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enterprise Invitations</h2>
                <p className="text-gray-600 mt-1">
                  Manage pending invitations and invite new enterprise users.
                </p>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Enterprise User</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join an existing enterprise.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="userName">Name</Label>
                        <Input
                          id="userName"
                          value={inviteUser.name}
                          onChange={(e) => setInviteUser(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="userEmail">Email</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          value={inviteUser.email}
                          onChange={(e) => setInviteUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Select value={inviteUser.companyId} onValueChange={(value) => setInviteUser(prev => ({ ...prev, companyId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {enterprises.map(enterprise => (
                              <SelectItem key={enterprise.id} value={enterprise.id}>
                                {enterprise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="userRole">Role</Label>
                        <Select 
                          value={inviteUser.role} 
                          onValueChange={(value: 'enterprise_manager' | 'enterprise_user') => 
                            setInviteUser(prev => ({ ...prev, role: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enterprise_user">Enterprise User</SelectItem>
                            <SelectItem value="enterprise_manager">Enterprise Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={inviteEnterpriseUser} disabled={inviteLoading}>
                        {inviteLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Pending Invitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Pending Invitations ({pendingInvitations.length})
                </CardTitle>
                <CardDescription>
                  Manage pending enterprise user invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Invitations</h3>
                    <p className="text-gray-600 mb-4">
                      All invitations have been accepted or there are no pending invites.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-semibold text-gray-900">{invitation.name}</div>
                              <div className="text-sm text-gray-600">{invitation.email}</div>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {invitation.role.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{invitation.company_name}</div>
                              <div className="text-xs text-gray-500">
                                Invited by {invitation.invited_by_name}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Sent: {new Date(invitation.created_at).toLocaleDateString()} • 
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(invitation.status)}>
                            {invitation.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitation(invitation.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
