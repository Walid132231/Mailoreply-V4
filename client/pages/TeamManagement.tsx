import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  UserPlus, 
  Mail,
  Upload,
  MoreHorizontal,
  Clock,
  X,
  Trash2,
  RefreshCw,
  Edit,
  Eye
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  lastActive: string;
  generationsUsed: number;
  templatesCreated: number;
}

interface PendingInvitation {
  id: string;
  email: string;
  name?: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
}

interface NewInvitation {
  email: string;
  name: string;
}

export default function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [newInvitation, setNewInvitation] = useState<NewInvitation>({ email: '', name: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // TODO: Replace with real Supabase queries
      // const { data: members } = await supabase.from('users').select('*').eq('company_id', user?.company_id);
      // const { data: invitations } = await supabase.from('invitations').select('*').eq('company_id', user?.company_id);
      
      // Temporary placeholder - remove when Supabase is connected
      setTeamMembers([]);
      setPendingInvitations([]);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!newInvitation.email || !newInvitation.name) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // TODO: Add real Supabase integration
      // const { data, error } = await supabase.from('invitations').insert([
      //   {
      //     email: newInvitation.email,
      //     name: newInvitation.name,
      //     company_id: user?.company_id,
      //     invited_by: user?.id,
      //     token: generateToken(),
      //     expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      //   }
      // ]);
      
      console.log('Sending invitation:', newInvitation);
      alert('Invitation sent successfully!');
      setIsInviting(false);
      setNewInvitation({ email: '', name: '' });
      fetchTeamData();
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const invitations = [];

        // Skip header row and process CSV
        for (let i = 1; i < lines.length; i++) {
          const [email, name] = lines[i].split(',').map(s => s.trim());
          if (email && name) {
            invitations.push({ email, name });
          }
        }

        if (invitations.length === 0) {
          alert('No valid invitations found in CSV file');
          return;
        }

        // TODO: Add real Supabase integration for bulk invitations
        // const { data, error } = await supabase.from('invitations').insert(
        //   invitations.map(inv => ({
        //     email: inv.email,
        //     name: inv.name,
        //     company_id: user?.company_id,
        //     invited_by: user?.id,
        //     token: generateToken(),
        //     expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        //   }))
        // );

        console.log('Bulk invitations:', invitations);
        alert(`Successfully imported ${invitations.length} invitations!`);
        fetchTeamData();
      } catch (error) {
        console.error('Error processing CSV:', error);
        alert('Error processing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      // TODO: Add real Supabase integration
      // const { error } = await supabase.from('invitations')
      //   .update({ expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() })
      //   .eq('id', invitationId);
      
      console.log('Resending invitation:', invitationId);
      alert('Invitation resent successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation.');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      // TODO: Add real Supabase integration
      // const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
      
      console.log('Deleting invitation:', invitationId);
      alert('Invitation deleted successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Failed to delete invitation.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      // TODO: Add real Supabase integration
      // const { error } = await supabase.from('users').delete().eq('id', memberId);
      
      console.log('Removing member:', memberId);
      alert('Team member removed successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove team member.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your team members and invitations.
            </p>
          </div>
          <div className="flex space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCSVImport}
              accept=".csv"
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Dialog open={isInviting} onOpenChange={setIsInviting}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={newInvitation.email}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Name (Optional)</Label>
                    <Input
                      id="invite-name"
                      placeholder="John Doe"
                      value={newInvitation.name}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsInviting(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendInvitation}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{teamMembers.filter(m => m.status === 'active').length}</span> active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvitations.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.reduce((sum, member) => sum + member.generationsUsed, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Templates</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.reduce((sum, member) => sum + member.templatesCreated, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Created by team
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your team members and their access</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600">No team members yet</p>
                <p className="text-sm text-gray-500 mb-4">Invite your first team member to get started</p>
                <Button onClick={() => setIsInviting(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <span className="text-brand-600 font-medium text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.generationsUsed} generations</p>
                        <p className="text-xs text-gray-500">{member.templatesCreated} templates</p>
                      </div>
                      
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Last active</p>
                        <p className="text-sm">{member.lastActive}</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting for response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.length > 0 ? (
                pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{invitation.email}</h4>
                        <p className="text-sm text-gray-600">Invited {invitation.invitedAt}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-yellow-700">Expires in {invitation.expiresAt}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No pending invitations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
