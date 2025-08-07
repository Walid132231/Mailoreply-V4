import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, supabaseServiceRole, isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface Enterprise {
  id: string;
  name: string;
  domain?: string;
  users: number;
  maxUsers: number;
  generationsUsed: number;
  generationsLimit: number;
  monthlyPayment: number;
  status: 'active' | 'warning' | 'suspended';
  contractEnd?: string;
  manager?: string;
}

interface SystemStats {
  totalEnterprises: number;
  totalUsers: number;
  totalRevenue: number;
  totalGenerations: number;
}

interface NewEnterprise {
  name: string;
  domain: string;
  maxUsers: number;
  monthlyPayment: number;
  managerEmail: string;
  managerName: string;
}

export default function EnterpriseManagement() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalEnterprises: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalGenerations: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAddingEnterprise, setIsAddingEnterprise] = useState(false);
  const [newEnterprise, setNewEnterprise] = useState<NewEnterprise>({
    name: '',
    domain: '',
    maxUsers: 50,
    monthlyPayment: 999.99,
    managerEmail: '',
    managerName: ''
  });

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.error('Supabase not configured');
        setLoading(false);
        return;
      }

      // Fetch companies from Supabase
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          users (
            id,
            name,
            email,
            role
          )
        `);

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        setEnterprises([]);
      } else {
        // Transform Supabase data to Enterprise format
        const transformedEnterprises: Enterprise[] = companies.map(company => ({
          id: company.id,
          name: company.name,
          domain: company.domain || '',
          users: company.current_users || 0,
          maxUsers: company.max_users || 0,
          generationsUsed: 0, // TODO: Calculate from ai_generations table
          generationsLimit: -1, // Unlimited for enterprises
          monthlyPayment: company.monthly_payment || 999.99,
          status: company.status === 'active' ? 'active' : 'suspended',
          contractEnd: company.contract_end,
          manager: company.users?.find((u: any) => u.role === 'enterprise_manager')?.name || 'No Manager'
        }));

        setEnterprises(transformedEnterprises);

        // Calculate system stats
        const totalEnterprises = companies.length;
        const totalUsers = companies.reduce((sum, company) => sum + (company.current_users || 0), 0);
        const totalRevenue = companies.reduce((sum, company) => sum + (company.monthly_payment || 0), 0);
        
        setSystemStats({
          totalEnterprises,
          totalUsers,
          totalRevenue,
          totalGenerations: 0 // TODO: Calculate from ai_generations table
        });
      }
    } catch (error) {
      console.error('Error fetching enterprises:', error);
      setEnterprises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnterprise = async () => {
    try {
      if (!newEnterprise.name || !newEnterprise.managerEmail || !newEnterprise.managerName) {
        alert('Please fill in all required fields');
        return;
      }

      if (!isServiceRoleConfigured || !supabaseServiceRole) {
        alert('Service role not configured. Please contact administrator.');
        return;
      }

      console.log('Creating enterprise with service role client...');
      setIsAddingEnterprise(true);

      // Create company first using service role client (bypasses RLS)
      const { data: company, error: companyError } = await supabaseServiceRole
        .from('companies')
        .insert({
          name: newEnterprise.name,
          domain: newEnterprise.domain,
          plan_type: 'enterprise',
          max_users: newEnterprise.maxUsers,
          current_users: 0,
          monthly_payment: newEnterprise.monthlyPayment,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        alert(`Error creating company: ${companyError.message}`);
        return;
      }

      console.log('Company created successfully:', company);

      // Create manager user using service role client (bypasses RLS)
      const { data: userData, error: userError } = await supabaseServiceRole
        .from('users')
        .insert({
          name: newEnterprise.managerName,
          email: newEnterprise.managerEmail,
          role: 'enterprise_manager',
          company_id: company.id,
          daily_limit: -1,
          monthly_limit: -1,
          device_limit: -1,
          status: 'pending'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        alert(`Error creating user: ${userError.message}`);
        return;
      }

      console.log('User created successfully:', userData);

      // Send invitation to the manager using service role client
      const { data: inviteResult, error: inviteError } = await supabaseServiceRole
        .rpc('invite_enterprise_user', {
          user_email: newEnterprise.managerEmail,
          user_name: newEnterprise.managerName,
          user_role: 'enterprise_manager',
          manager_user_id: userData.id
        });

      if (inviteError) {
        console.error('Error sending invitation:', inviteError);
        alert(`Error sending invitation: ${inviteError.message}`);
        return;
      }

      if (!inviteResult?.success) {
        alert(`Failed to send invitation: ${inviteResult?.error || 'Unknown error'}`);
        return;
      }

      console.log('Invitation sent successfully');
      alert(`Enterprise "${newEnterprise.name}" created and invitation sent to ${newEnterprise.managerEmail}`);

      // Reset form and close dialog
      setNewEnterprise({
        name: '',
        domain: '',
        maxUsers: 50,
        monthlyPayment: 999.99,
        managerEmail: '',
        managerName: ''
      });

      // Refresh the list
      fetchEnterprises();
    } catch (error) {
      console.error('Error adding enterprise:', error);
      alert(`Error adding enterprise: ${error}`);
    } finally {
      setIsAddingEnterprise(false);
    }
  };

  const handleDeleteEnterprise = async (enterpriseId: string) => {
    if (!confirm('Are you sure you want to delete this enterprise? This action cannot be undone.')) {
      return;
    }

    try {
      if (!isServiceRoleConfigured || !supabaseServiceRole) {
        alert('Service role not configured. Please contact administrator.');
        return;
      }

      console.log('Deleting enterprise:', enterpriseId);

      // First, delete all users associated with this company
      const { error: usersError } = await supabaseServiceRole
        .from('users')
        .delete()
        .eq('company_id', enterpriseId);

      if (usersError) {
        console.error('Error deleting users:', usersError);
        alert(`Error deleting users: ${usersError.message}`);
        return;
      }

      // Then delete the company
      const { error: companyError } = await supabaseServiceRole
        .from('companies')
        .delete()
        .eq('id', enterpriseId);

      if (companyError) {
        console.error('Error deleting company:', companyError);
        alert(`Error deleting company: ${companyError.message}`);
        return;
      }

      alert('Enterprise deleted successfully');
      
      // Refresh the list
      fetchEnterprises();
    } catch (error) {
      console.error('Error deleting enterprise:', error);
      alert(`Error deleting enterprise: ${error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise Management</h1>
            <p className="text-gray-600 mt-1">
              Manage enterprise clients and their subscriptions.
            </p>
          </div>
          <Dialog open={isAddingEnterprise} onOpenChange={setIsAddingEnterprise}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Enterprise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Enterprise</DialogTitle>
                <DialogDescription>
                  Create a new enterprise account with manager access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Acme Corp"
                      value={newEnterprise.name}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-domain">Domain</Label>
                    <Input
                      id="company-domain"
                      placeholder="acme.com"
                      value={newEnterprise.domain}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, domain: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-name">Manager Name</Label>
                    <Input
                      id="manager-name"
                      placeholder="John Doe"
                      value={newEnterprise.managerName}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, managerName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-email">Manager Email</Label>
                    <Input
                      id="manager-email"
                      type="email"
                      placeholder="john@acme.com"
                      value={newEnterprise.managerEmail}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, managerEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-users">Max Users</Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={newEnterprise.maxUsers}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-payment">Monthly Payment ($)</Label>
                    <Input
                      id="monthly-payment"
                      type="number"
                      step="0.01"
                      value={newEnterprise.monthlyPayment}
                      onChange={(e) => setNewEnterprise(prev => ({ ...prev, monthlyPayment: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingEnterprise(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEnterprise}>
                    Create Enterprise
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enterprises</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalEnterprises}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
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
              <div className="text-2xl font-bold">${systemStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalGenerations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise List */}
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Clients</CardTitle>
            <CardDescription>Manage your enterprise subscriptions and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading enterprises...</p>
                </div>
              ) : enterprises.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600">No enterprises yet</p>
                  <p className="text-sm text-gray-500 mb-4">Add your first enterprise to get started</p>
                  <Button onClick={() => setIsAddingEnterprise(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Enterprise
                  </Button>
                </div>
              ) : enterprises.map((enterprise) => (
                <div key={enterprise.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{enterprise.name}</h3>
                        <p className="text-gray-600">{enterprise.domain}</p>
                        <p className="text-sm text-gray-500">Manager: {enterprise.manager}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStatusColor(enterprise.status)}>
                            {enterprise.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Contract ends: {enterprise.contractEnd}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${enterprise.monthlyPayment.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">per month</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDeleteEnterprise(enterprise.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Usage Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Users</span>
                        <span className="text-sm text-gray-600">
                          {enterprise.users} / {enterprise.maxUsers}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(enterprise.users / enterprise.maxUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">AI Generations</span>
                        <span className="text-sm text-gray-600">
                          {enterprise.generationsUsed.toLocaleString()} 
                          {enterprise.generationsLimit === -1 ? ' / Unlimited' : ` / ${enterprise.generationsLimit.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${getUsagePercentage(enterprise.generationsUsed, enterprise.generationsLimit)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {enterprise.status === 'active' && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Active</span>
                        </div>
                      )}
                      {enterprise.status === 'warning' && (
                        <div className="flex items-center text-yellow-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Needs Attention</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsAddingEnterprise(true)}
          >
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Add New Enterprise</CardTitle>
                  <CardDescription>Create a new enterprise account</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => alert('Billing overview coming soon - will integrate with Stripe dashboard')}
          >
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Billing Overview</CardTitle>
                  <CardDescription>View revenue and payments</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => alert('Usage analytics coming soon - will show detailed Supabase analytics')}
          >
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Usage Analytics</CardTitle>
                  <CardDescription>Detailed usage reports</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
