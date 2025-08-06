import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users,
  Building2,
  Mail,
  Plus,
  Upload,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Download,
  Eye,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  Calendar,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Copy
} from 'lucide-react';

// Enhanced interfaces
interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: 'enterprise_user' | 'enterprise_manager';
  status: 'active' | 'inactive';
  daily_usage: number;
  monthly_usage: number;
  daily_limit: number;
  monthly_limit: number;
  last_active: string | null;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: 'enterprise_user' | 'enterprise_manager';
  status: string;
  invitation_token: string;
  expires_at: string;
  created_at: string;
  days_remaining: number;
}

interface BulkInviteUser {
  name: string;
  email: string;
  role: 'enterprise_user' | 'enterprise_manager';
}

interface InvitationResult {
  total_processed: number;
  successful_count: number;
  failed_count: number;
  successful_invitations: any[];
  failed_invitations: any[];
}

export default function EnhancedEnterpriseManager() {
  const { user } = useAuth();
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Single invite state
  const [singleInvite, setSingleInvite] = useState({
    name: '',
    email: '',
    role: 'enterprise_user' as 'enterprise_user' | 'enterprise_manager'
  });

  // Bulk import state
  const [bulkUsers, setBulkUsers] = useState<BulkInviteUser[]>([]);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportResults, setBulkImportResults] = useState<InvitationResult | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  useEffect(() => {
    if (user?.role === 'enterprise_manager') {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanyUsers(),
        fetchPendingInvitations()
      ]);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyUsers = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode
      setCompanyUsers([
        {
          id: 'demo-1',
          email: 'john@company.com',
          name: 'John Smith',
          role: 'enterprise_user',
          status: 'active',
          daily_usage: 5,
          monthly_usage: 45,
          daily_limit: -1,
          monthly_limit: -1,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]);
      return;
    }

    const { data, error } = await supabase
      .rpc('get_company_users');

    if (error) {
      console.error('Error fetching company users:', error);
      return;
    }

    setCompanyUsers(data || []);
  };

  const fetchPendingInvitations = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode  
      setPendingInvitations([
        {
          id: 'demo-inv-1',
          email: 'pending@company.com',
          name: 'Pending User',
          role: 'enterprise_user',
          status: 'pending',
          invitation_token: 'demo-token',
          expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          days_remaining: 5
        }
      ]);
      return;
    }

    const { data, error } = await supabase
      .rpc('get_pending_invitations');

    if (error) {
      console.error('Error fetching pending invitations:', error);
      return;
    }

    setPendingInvitations(data || []);
  };

  const inviteSingleUser = async () => {
    if (!singleInvite.name.trim() || !singleInvite.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode
        setSuccess(`Demo: Invitation sent to ${singleInvite.email}`);
        setSingleInvite({ name: '', email: '', role: 'enterprise_user' });
        setIsInviteDialogOpen(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('invite_enterprise_user', {
          user_email: singleInvite.email,
          user_name: singleInvite.name,
          user_role: singleInvite.role
        });

      if (error) throw error;

      if (data.success) {
        setSuccess(`Invitation sent to ${singleInvite.email}!`);
        setSingleInvite({ name: '', email: '', role: 'enterprise_user' });
        setIsInviteDialogOpen(false);
        
        // TODO: Send actual email invitation using data.invitation_token
        await sendEmailInvitation(data);
        
        await fetchPendingInvitations();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const parseBulkImportText = () => {
    if (!bulkImportText.trim()) {
      setError('Please enter user data to import');
      return;
    }

    try {
      const lines = bulkImportText.trim().split('\n');
      const users: BulkInviteUser[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Support multiple formats:
        // 1. "Name, email@domain.com"  
        // 2. "Name, email@domain.com, role"
        // 3. "email@domain.com" (extract name from email)
        
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 1) continue;

        let name = '';
        let email = '';
        let role: 'enterprise_user' | 'enterprise_manager' = 'enterprise_user';

        if (parts.length === 1) {
          // Just email
          email = parts[0];
          name = email.split('@')[0].replace(/[._]/g, ' ');
        } else if (parts.length === 2) {
          // Name, email
          name = parts[0];
          email = parts[1];
        } else if (parts.length >= 3) {
          // Name, email, role
          name = parts[0];
          email = parts[1];
          role = parts[2].toLowerCase() === 'manager' || parts[2].toLowerCase() === 'enterprise_manager' 
            ? 'enterprise_manager' 
            : 'enterprise_user';
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError(`Invalid email format on line ${i + 1}: ${email}`);
          return;
        }

        users.push({ name, email, role });
      }

      if (users.length === 0) {
        setError('No valid users found in the import data');
        return;
      }

      setBulkUsers(users);
      setError('');
      setSuccess(`Parsed ${users.length} users for import`);
    } catch (error) {
      console.error('Error parsing bulk import:', error);
      setError('Failed to parse import data');
    }
  };

  const processBulkInvitations = async () => {
    if (bulkUsers.length === 0) {
      setError('No users to process. Please parse the import data first.');
      return;
    }

    setIsProcessingBulk(true);
    setError('');

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode
        setBulkImportResults({
          total_processed: bulkUsers.length,
          successful_count: bulkUsers.length,
          failed_count: 0,
          successful_invitations: bulkUsers,
          failed_invitations: []
        });
        setSuccess(`Demo: Processed ${bulkUsers.length} invitations`);
        return;
      }

      const { data, error } = await supabase
        .rpc('bulk_invite_enterprise_users', {
          users_data: bulkUsers
        });

      if (error) throw error;

      setBulkImportResults(data);
      
      if (data.successful_count > 0) {
        setSuccess(`Successfully sent ${data.successful_count} invitations!`);
        
        // Send email invitations for successful ones
        for (const invitation of data.successful_invitations) {
          await sendEmailInvitation(invitation);
        }
        
        await fetchPendingInvitations();
      }

      if (data.failed_count > 0) {
        setError(`${data.failed_count} invitations failed to send`);
      }

    } catch (error) {
      console.error('Error processing bulk invitations:', error);
      setError('Failed to process bulk invitations');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const sendEmailInvitation = async (invitationData: any) => {
    // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Sending email invitation:', invitationData);
    
    // This would typically call your email service API
    // Example structure for email content:
    const emailData = {
      to: invitationData.email,
      subject: `You're invited to join ${invitationData.company_name} on MailoReply AI`,
      template: 'enterprise-invitation',
      data: {
        name: invitationData.name,
        company_name: invitationData.company_name,
        manager_name: invitationData.manager_name,
        invitation_url: invitationData.invitation_url,
        expires_at: invitationData.expires_at
      }
    };
    
    // Placeholder for actual email sending
    return Promise.resolve();
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        setSuccess('Demo: Invitation cancelled');
        return;
      }

      const { data, error } = await supabase
        .rpc('cancel_invitation', { invitation_id: invitationId });

      if (error) throw error;

      setSuccess('Invitation cancelled successfully');
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      setError('Failed to cancel invitation');
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        setSuccess('Demo: Invitation resent');
        return;
      }

      const { data, error } = await supabase
        .rpc('resend_invitation', { invitation_id: invitationId });

      if (error) throw error;

      if (data.success) {
        await sendEmailInvitation(data);
        setSuccess('Invitation resent successfully');
        await fetchPendingInvitations();
      } else {
        setError(data.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      setError('Failed to resend invitation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const copyInvitationLink = (token: string) => {
    const url = `https://yourdomain.com/accept-invitation/${token}`;
    navigator.clipboard.writeText(url);
    setSuccess('Invitation link copied to clipboard');
  };

  const downloadBulkTemplate = () => {
    const template = `John Smith, john@company.com, enterprise_user
Jane Doe, jane@company.com, enterprise_manager
Mike Johnson, mike@company.com
sarah@company.com`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-invite-template.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'enterprise_manager') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only enterprise managers can access this page.</p>
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
              <Building2 className="mr-3 h-8 w-8 text-purple-600" />
              Team Management
            </h1>
            <p className="text-gray-600 mt-1">
              Invite and manage your enterprise team members
            </p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Team ({companyUsers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Pending ({pendingInvitations.length})</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Team Members Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Active enterprise users in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading team members...</p>
                  </div>
                ) : companyUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start by inviting your first team member
                    </p>
                    <Button onClick={() => setIsInviteDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {companyUsers.map((companyUser) => (
                      <div key={companyUser.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-sm">
                                {companyUser.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{companyUser.name}</h4>
                              <p className="text-sm text-gray-600">{companyUser.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getStatusColor(companyUser.status)}>
                                  {companyUser.status}
                                </Badge>
                                <Badge variant="outline">
                                  {companyUser.role === 'enterprise_manager' ? 'Manager' : 'User'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {companyUser.last_active 
                                ? `Active ${new Date(companyUser.last_active).toLocaleDateString()}`
                                : 'Never active'
                              }
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Daily Usage</span>
                              <span className="text-sm text-gray-600">
                                {companyUser.daily_usage} / {companyUser.daily_limit === -1 ? '∞' : companyUser.daily_limit}
                              </span>
                            </div>
                            <Progress value={getUsagePercentage(companyUser.daily_usage, companyUser.daily_limit)} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Monthly Usage</span>
                              <span className="text-sm text-gray-600">
                                {companyUser.monthly_usage} / {companyUser.monthly_limit === -1 ? '∞' : companyUser.monthly_limit}
                              </span>
                            </div>
                            <Progress value={getUsagePercentage(companyUser.monthly_usage, companyUser.monthly_limit)} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Invitations Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations waiting to be accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending invitations</h3>
                    <p className="text-gray-600">
                      All invitations have been accepted or expired
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{invitation.name}</h4>
                            <p className="text-sm text-gray-600">{invitation.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(invitation.status)}>
                                {invitation.status}
                              </Badge>
                              <Badge variant="outline">
                                {invitation.role === 'enterprise_manager' ? 'Manager' : 'User'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Expires in {invitation.days_remaining} days
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationLink(invitation.invitation_token)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendInvitation(invitation.id)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companyUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {companyUsers.filter(u => u.status === 'active').length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingInvitations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting acceptance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {companyUsers.reduce((sum, user) => sum + user.monthly_usage, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Single User Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your enterprise team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={singleInvite.name}
                  onChange={(e) => setSingleInvite(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={singleInvite.email}
                  onChange={(e) => setSingleInvite(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={singleInvite.role}
                  onValueChange={(value: 'enterprise_user' | 'enterprise_manager') => 
                    setSingleInvite(prev => ({ ...prev, role: value }))
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteSingleUser} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Bulk Import Users</span>
              </DialogTitle>
              <DialogDescription>
                Import multiple users at once using a simple text format
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">Format Instructions</h4>
                  <Button variant="outline" size="sm" onClick={downloadBulkTemplate}>
                    <Download className="h-3 w-3 mr-1" />
                    Download Template
                  </Button>
                </div>
                <p className="text-sm text-blue-800 mb-2">
                  Enter one user per line in any of these formats:
                </p>
                <div className="bg-white p-2 rounded text-xs font-mono">
                  <div>John Smith, john@company.com, enterprise_user</div>
                  <div>Jane Doe, jane@company.com, enterprise_manager</div>
                  <div>Mike Johnson, mike@company.com</div>
                  <div>sarah@company.com</div>
                </div>
              </div>

              {/* Import Text Area */}
              <div>
                <Label htmlFor="bulk-import">User Data</Label>
                <Textarea
                  id="bulk-import"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="Paste your user list here..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex justify-between mt-2">
                  <Button variant="outline" onClick={parseBulkImportText}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Parse Data ({bulkImportText.split('\n').filter(l => l.trim()).length} lines)
                  </Button>
                </div>
              </div>

              {/* Parsed Users Preview */}
              {bulkUsers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Preview ({bulkUsers.length} users)</h4>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 border-b font-medium text-sm">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Role</div>
                    </div>
                    {bulkUsers.map((user, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 p-3 border-b last:border-b-0 text-sm">
                        <div>{user.name}</div>
                        <div className="text-gray-600">{user.email}</div>
                        <div>
                          <Badge variant="outline">
                            {user.role === 'enterprise_manager' ? 'Manager' : 'User'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Import Results */}
              {bulkImportResults && (
                <div className="space-y-4">
                  <h4 className="font-medium">Import Results</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{bulkImportResults.total_processed}</div>
                          <div className="text-sm text-gray-600">Total Processed</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{bulkImportResults.successful_count}</div>
                          <div className="text-sm text-gray-600">Successful</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{bulkImportResults.failed_count}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {bulkImportResults.failed_count > 0 && (
                    <div>
                      <h5 className="font-medium text-red-600 mb-2">Failed Invitations</h5>
                      <div className="space-y-2">
                        {bulkImportResults.failed_invitations.map((failed: any, index: number) => (
                          <div key={index} className="bg-red-50 p-3 rounded-lg">
                            <div className="font-medium">{failed.name} ({failed.email})</div>
                            <div className="text-sm text-red-600">{failed.error}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                  Close
                </Button>
                {bulkUsers.length > 0 && !bulkImportResults && (
                  <Button onClick={processBulkInvitations} disabled={isProcessingBulk}>
                    {isProcessingBulk ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send {bulkUsers.length} Invitations
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}