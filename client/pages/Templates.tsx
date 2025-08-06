import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Database, isSupabaseConfigured } from "@/lib/supabase";
import { copyWithFeedback } from "@/lib/clipboard";
import { 
  Mail, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  CheckCircle,
  X,
  Users,
  Lock,
  AlertCircle,
  Loader2
} from "lucide-react";

type Template = Database['public']['Tables']['templates']['Row'];

// No mock templates in production
const mockTemplates: Template[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    company_id: null,
    title: 'Professional Follow-up',
    content: 'Thank you for your email. I will review your request and get back to you within 24 hours.',
    subject: 'Re: Your Inquiry',
    hotkey: 'pf',
    visibility: 'private',
    approved_by: null,
    approved_at: null,
    usage_count: 5,
    tags: ['follow-up', 'professional'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    company_id: null,
    title: 'Meeting Request',
    content: 'I would like to schedule a meeting to discuss this further. Please let me know your availability.',
    subject: 'Meeting Request',
    hotkey: 'mr',
    visibility: 'private',
    approved_by: null,
    approved_at: null,
    usage_count: 12,
    tags: ['meeting', 'schedule'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    user_id: 'demo-user',
    company_id: 'demo-company',
    title: 'Company Policy Update',
    content: 'Please review the updated company policy document attached to this email.',
    subject: 'Policy Update',
    hotkey: 'cpu',
    visibility: 'company',
    approved_by: 'demo-manager',
    approved_at: new Date().toISOString(),
    usage_count: 25,
    tags: ['policy', 'company'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
type TemplateUpdate = Database['public']['Tables']['templates']['Update'];

interface NewTemplate {
  title: string;
  content: string;
  subject: string;
  hotkey: string;
  visibility: 'private' | 'company' | 'pending_approval';
}

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pendingTemplates, setPendingTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [error, setError] = useState('');
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    title: '',
    content: '',
    subject: '',
    hotkey: '',
    visibility: 'private'
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - templates unavailable');
        setTemplates([]);
        setLoading(false);
        return;
      }

      // Fetch user's private templates
      const { data: privateTemplates, error: privateError } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user!.id)
        .eq('visibility', 'private')
        .order('created_at', { ascending: false });

      if (privateError) throw privateError;

      // Fetch company templates if user belongs to a company
      let companyTemplates: Template[] = [];
      if (user!.company_id && supabase) {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('company_id', user!.company_id)
          .eq('visibility', 'company')
          .order('created_at', { ascending: false });

        if (error) throw error;
        companyTemplates = data || [];
      }

      // Fetch pending templates if user is enterprise manager
      let pendingList: Template[] = [];
      if (user!.role === 'enterprise_manager' && user!.company_id) {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('company_id', user!.company_id)
          .eq('visibility', 'pending_approval')
          .order('created_at', { ascending: false });

        if (error) throw error;
        pendingList = data || [];
      }

      setTemplates([...(privateTemplates || []), ...companyTemplates]);
      setPendingTemplates(pendingList);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !newTemplate.title.trim() || !newTemplate.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot create template');
        setIsCreating(false);
        setNewTemplate({
          title: '',
          content: '',
          subject: '',
          hotkey: '',
          visibility: 'private'
        });
        await fetchTemplates();
        return;
      }

      const templateData: TemplateInsert = {
        user_id: user.id,
        company_id: user.company_id,
        title: newTemplate.title.trim(),
        content: newTemplate.content.trim(),
        subject: newTemplate.subject.trim() || null,
        hotkey: newTemplate.hotkey.trim() || null,
        visibility: newTemplate.visibility,
        usage_count: 0,
      };

      const { data, error } = await supabase
        .from('templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;

      setIsCreating(false);
      setNewTemplate({
        title: '',
        content: '',
        subject: '',
        hotkey: '',
        visibility: 'private'
      });
      
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate || !user) return;

    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot update template');
        setIsEditing(false);
        setEditingTemplate(null);
        return;
      }

      const updateData: TemplateUpdate = {
        title: editingTemplate.title.trim(),
        content: editingTemplate.content.trim(),
        subject: editingTemplate.subject?.trim() || null,
        hotkey: editingTemplate.hotkey?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', editingTemplate.id)
        .eq('user_id', user.id); // Ensure user can only edit their own templates

      if (error) throw error;

      setIsEditing(false);
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      setError('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user || !confirm('Are you sure you want to delete this template?')) return;

    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot delete template');
        return;
      }

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id); // Ensure user can only delete their own templates

      if (error) throw error;

      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  const handleApproveTemplate = async (templateId: string) => {
    if (!user || user.role !== 'enterprise_manager') return;

    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot approve template');
        return;
      }

      const { error } = await supabase
        .from('templates')
        .update({
          visibility: 'company',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('company_id', user.company_id);

      if (error) throw error;

      await fetchTemplates();
    } catch (error) {
      console.error('Error approving template:', error);
      setError('Failed to approve template');
    }
  };

  const handleRejectTemplate = async (templateId: string) => {
    if (!user || user.role !== 'enterprise_manager') return;

    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot reject template');
        return;
      }

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .eq('company_id', user.company_id)
        .eq('visibility', 'pending_approval');

      if (error) throw error;

      await fetchTemplates();
    } catch (error) {
      console.error('Error rejecting template:', error);
      setError('Failed to reject template');
    }
  };

  const copyToClipboard = async (text: string) => {
    await copyWithFeedback(text);
  };

  const incrementUsageCount = async (templateId: string) => {
    try {
      // Check if database is configured
      if (!isSupabaseConfigured || !supabase) {
        console.error('Database not configured - cannot increment usage');
        return;
      }

      const { error } = await supabase.rpc('increment_template_usage', {
        template_id: templateId
      });

      if (error) {
        // Fallback: manual increment
        const template = templates.find(t => t.id === templateId);
        if (template && supabase) {
          await supabase
            .from('templates')
            .update({ usage_count: template.usage_count + 1 })
            .eq('id', templateId);
        }
      }
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  };

  const handleCopyTemplate = async (template: Template) => {
    await copyToClipboard(template.content);
    await incrementUsageCount(template.id);
    // Refresh templates to show updated usage count
    setTimeout(fetchTemplates, 500);
  };

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateTemplates = ['enterprise_manager', 'enterprise_user', 'pro_plus', 'pro', 'free'].includes(user?.role || '');
  const canApproveTemplates = user?.role === 'enterprise_manager';
  const canSeeCompanyTemplates = !!user?.company_id;

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canCreateTemplates) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Email templates and hotkey shortcuts.</p>
          </div>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Lock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Templates Not Available</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Templates and hotkeys are available with Pro plans and above.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your email templates with hotkey shortcuts.
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="my-templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-templates">
              My Templates ({templates.filter(t => t.visibility === 'private').length})
            </TabsTrigger>
            {canSeeCompanyTemplates && (
              <TabsTrigger value="company-templates">
                Company Templates ({templates.filter(t => t.visibility === 'company').length})
              </TabsTrigger>
            )}
            {canApproveTemplates && (
              <TabsTrigger value="pending-approval">
                Pending Approval ({pendingTemplates.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-templates" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.filter(t => t.visibility === 'private').map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <CardDescription>
                            Used {template.usage_count} times
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyTemplate(template)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {template.content}
                      </p>
                      <div className="flex items-center justify-between">
                        {template.hotkey && (
                          <Badge variant="outline" className="text-xs">
                            {template.hotkey}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTemplates.filter(t => t.visibility === 'private').length === 0 && !loading && (
                  <div className="col-span-full text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">No templates yet</p>
                    <p className="text-sm text-gray-500 mb-4">Create your first template to get started</p>
                    <Button onClick={() => setIsCreating(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {canSeeCompanyTemplates && (
            <TabsContent value="company-templates" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.filter(t => t.visibility === 'company').map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <CardDescription>
                            Used {template.usage_count} times
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyTemplate(template)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {template.content}
                      </p>
                      <div className="flex items-center justify-between">
                        {template.hotkey && (
                          <Badge variant="outline" className="text-xs">
                            {template.hotkey}
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Company
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {canApproveTemplates && (
            <TabsContent value="pending-approval" className="space-y-6">
              <div className="space-y-4">
                {pendingTemplates.map((template) => (
                  <Card key={template.id} className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <CardDescription>
                            Submitted on {new Date(template.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveTemplate(template.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRejectTemplate(template.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {template.subject && (
                          <div>
                            <Label className="text-sm font-medium">Subject</Label>
                            <p className="text-sm text-gray-700">{template.subject}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">Content</Label>
                          <p className="text-sm text-gray-700">{template.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {pendingTemplates.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">No pending approvals</p>
                      <p className="text-sm text-gray-500">All template submissions have been reviewed</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Create Template Modal */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Create a new email template with hotkey support
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-title">Template Title</Label>
                <Input
                  id="template-title"
                  placeholder="e.g., Meeting Follow-up"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject (Optional)</Label>
                <Input
                  id="template-subject"
                  placeholder="e.g., Follow-up: [TOPIC]"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  placeholder="Enter your email template content..."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[120px] max-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-hotkey">Hotkey (Optional)</Label>
                  <Input
                    id="template-hotkey"
                    placeholder="e.g., Ctrl+1"
                    value={newTemplate.hotkey}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, hotkey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={newTemplate.visibility} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, visibility: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only you)</SelectItem>
                      {canSeeCompanyTemplates && (
                        <SelectItem value="pending_approval">Submit for Company (Requires approval)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Template Modal */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update your template content and settings
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Template Title</Label>
                  <Input
                    id="edit-title"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Email Subject (Optional)</Label>
                  <Input
                    id="edit-subject"
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-content">Template Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="min-h-[120px] max-h-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hotkey">Hotkey (Optional)</Label>
                  <Input
                    id="edit-hotkey"
                    value={editingTemplate.hotkey || ''}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, hotkey: e.target.value } : null)}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditTemplate}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>{selectedTemplate.title}</DialogTitle>
                    <DialogDescription>
                      Used {selectedTemplate.usage_count} times
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTemplate.subject && (
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {selectedTemplate.subject}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedTemplate.hotkey && (
                    <Badge variant="outline">
                      Hotkey: {selectedTemplate.hotkey}
                    </Badge>
                  )}
                  <Badge variant={selectedTemplate.visibility === 'private' ? 'secondary' : 'default'}>
                    {selectedTemplate.visibility === 'private' ? 'Private' : 'Company'}
                  </Badge>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleCopyTemplate(selectedTemplate)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Content
                  </Button>
                  {selectedTemplate.user_id === user.id && (
                    <Button onClick={() => {
                      setEditingTemplate(selectedTemplate);
                      setSelectedTemplate(null);
                      setIsEditing(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
