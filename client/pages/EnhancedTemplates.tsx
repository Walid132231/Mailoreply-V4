import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { copyWithFeedback } from '@/lib/clipboard';
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
  Loader2,
  Send,
  Shield,
  Keyboard,
  Building,
  UserCheck,
  UserX,
  Archive
} from 'lucide-react';

// Enhanced template interface
interface EnhancedTemplate {
  id: string;
  user_id: string;
  company_id?: string;
  title: string;
  content: string;
  subject?: string;
  hotkey?: string;
  visibility: 'private' | 'company' | 'pending_approval';
  approved_by?: string;
  approved_at?: string;
  usage_count: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Additional fields for display
  created_by?: string;
  user_email?: string;
  approver_name?: string;
}

interface NewTemplate {
  title: string;
  content: string;
  subject: string;
  hotkey: string;
  visibility: 'private' | 'company' | 'pending_approval';
  tags: string[];
}

export default function EnhancedTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EnhancedTemplate[]>([]);
  const [pendingTemplates, setPendingTemplates] = useState<EnhancedTemplate[]>([]);
  const [privateTemplates, setPrivateTemplates] = useState<EnhancedTemplate[]>([]);
  const [extensionTemplates, setExtensionTemplates] = useState<EnhancedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    title: '',
    content: '',
    subject: '',
    hotkey: '',
    visibility: 'private',
    tags: []
  });

  const isEnterpriseManager = user?.role === 'enterprise_manager';
  const isEnterpriseUser = user?.role === 'enterprise_user';
  const isSuperuser = user?.role === 'superuser';

  useEffect(() => {
    if (user) {
      fetchAllTemplates();
    }
  }, [user]);

  const fetchAllTemplates = async () => {
    setLoading(true);
    setError('');

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode - show mock templates
        setPrivateTemplates([
          {
            id: 'demo-1',
            user_id: 'demo',
            title: 'Professional Follow-up',
            content: 'Thank you for your email. I will review your request and get back to you within 24 hours.',
            subject: 'Re: Your Inquiry',
            hotkey: 'pf',
            visibility: 'private',
            usage_count: 5,
            tags: ['follow-up', 'professional'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
        return;
      }

      await Promise.all([
        fetchPrivateTemplates(),
        fetchCompanyTemplates(),
        fetchPendingTemplates(),
        fetchExtensionTemplates()
      ]);

    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateTemplates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_user_private_templates', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching private templates:', error);
      return;
    }

    setPrivateTemplates(data || []);
  };

  const fetchCompanyTemplates = async () => {
    if (!user || !user.company_id) return;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', user.company_id)
      .eq('visibility', 'company')
      .not('approved_at', 'is', null);

    if (error) {
      console.error('Error fetching company templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  const fetchPendingTemplates = async () => {
    if (!isEnterpriseManager) return;

    const { data, error } = await supabase
      .rpc('get_pending_templates_for_approval');

    if (error) {
      console.error('Error fetching pending templates:', error);
      return;
    }

    setPendingTemplates(data || []);
  };

  const fetchExtensionTemplates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_templates_for_extension', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching extension templates:', error);
      return;
    }

    setExtensionTemplates(data || []);
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.title.trim() || !newTemplate.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode
        console.log('Demo: Template created', newTemplate);
        setSuccess('Template created successfully (Demo mode)');
        setIsCreating(false);
        return;
      }

      const templateData = {
        title: newTemplate.title.trim(),
        content: newTemplate.content.trim(),
        subject: newTemplate.subject.trim() || null,
        hotkey: newTemplate.hotkey.trim() || null,
        visibility: newTemplate.visibility,
        tags: newTemplate.tags.length > 0 ? newTemplate.tags : null,
        user_id: user.id,
        company_id: user.company_id || null
      };

      const { error } = await supabase
        .from('templates')
        .insert([templateData]);

      if (error) throw error;

      setSuccess('Template created successfully!');
      setIsCreating(false);
      setNewTemplate({
        title: '',
        content: '',
        subject: '',
        hotkey: '',
        visibility: 'private',
        tags: []
      });

      await fetchAllTemplates();

    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const submitForApproval = async (templateId: string) => {
    if (!isEnterpriseUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('submit_template_for_approval', { 
          template_id: templateId 
        });

      if (error) throw error;

      setSuccess('Template submitted for approval');
      await fetchAllTemplates();
    } catch (error) {
      console.error('Error submitting template:', error);
      setError('Failed to submit template for approval');
    } finally {
      setLoading(false);
    }
  };

  const approveTemplate = async (templateId: string) => {
    if (!isEnterpriseManager) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('approve_template', { template_id: templateId });

      if (error) throw error;

      setSuccess('Template approved successfully');
      await fetchAllTemplates();
    } catch (error) {
      console.error('Error approving template:', error);
      setError('Failed to approve template');
    } finally {
      setLoading(false);
    }
  };

  const rejectTemplate = async (templateId: string, reason?: string) => {
    if (!isEnterpriseManager) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('reject_template', { 
          template_id: templateId,
          rejection_reason: reason 
        });

      if (error) throw error;

      setSuccess('Template rejected');
      await fetchAllTemplates();
    } catch (error) {
      console.error('Error rejecting template:', error);
      setError('Failed to reject template');
    } finally {
      setLoading(false);
    }
  };

  const incrementTemplateUsage = async (templateId: string) => {
    try {
      await supabase
        .rpc('increment_template_usage', { template_id: templateId });
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const copyTemplateContent = async (template: EnhancedTemplate) => {
    await copyWithFeedback(template.content);
    await incrementTemplateUsage(template.id);
  };

  const getVisibilityBadge = (visibility: string, approved: boolean = false) => {
    switch (visibility) {
      case 'private':
        return <Badge variant="outline" className="text-gray-600 border-gray-300"><Lock className="w-3 h-3 mr-1" />Private</Badge>;
      case 'company':
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><Building className="w-3 h-3 mr-1" />Company</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredTemplates = (templateList: EnhancedTemplate[]) => {
    return templateList.filter(template =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please log in to manage templates</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
            <p className="text-gray-600">Manage your email templates and company templates</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a new email template for your use or company sharing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Template title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject">Email Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Email template content"
                    rows={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="hotkey">Extension Hotkey (Optional)</Label>
                  <Input
                    id="hotkey"
                    value={newTemplate.hotkey}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, hotkey: e.target.value }))}
                    placeholder="e.g., 'ff' for fast follow-up"
                    maxLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Shortcut for Chrome extension text expander (2-10 characters)
                  </p>
                </div>
                
                <div>
                  <Label>Template Visibility</Label>
                  <Select
                    value={newTemplate.visibility}
                    onValueChange={(value: 'private' | 'company' | 'pending_approval') => 
                      setNewTemplate(prev => ({ ...prev, visibility: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Private (Only you can see this)
                        </div>
                      </SelectItem>
                      {isEnterpriseUser && (
                        <SelectItem value="pending_approval">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Submit for Company Approval
                          </div>
                        </SelectItem>
                      )}
                      {isEnterpriseManager && (
                        <SelectItem value="company">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            Company Template (Immediate approval)
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTemplate} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Template Tabs */}
        <Tabs defaultValue="private" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="private" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Private ({privateTemplates.length})</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Company ({templates.length})</span>
            </TabsTrigger>
            {isEnterpriseManager && (
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pending ({pendingTemplates.length})</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="extension" className="flex items-center space-x-2">
              <Keyboard className="h-4 w-4" />
              <span>Extension ({extensionTemplates.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Private Templates */}
          <TabsContent value="private">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <span>Private Templates</span>
                </CardTitle>
                <CardDescription>
                  Templates visible only to you. {isEnterpriseUser && 'You can submit these for company approval.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates(privateTemplates).map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          {getVisibilityBadge(template.visibility)}
                        </div>
                        {template.subject && (
                          <CardDescription className="font-medium text-gray-700">
                            Subject: {template.subject}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {template.content}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Used {template.usage_count} times</span>
                          {template.hotkey && (
                            <div className="flex items-center space-x-1">
                              <Keyboard className="h-3 w-3" />
                              <span>/{template.hotkey}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyTemplateContent(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          {isEnterpriseUser && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => submitForApproval(template.id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Submit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Templates */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Company Templates</span>
                </CardTitle>
                <CardDescription>
                  Approved templates available to all company members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates(templates).map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow border-blue-100">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          {getVisibilityBadge(template.visibility, true)}
                        </div>
                        {template.subject && (
                          <CardDescription className="font-medium text-gray-700">
                            Subject: {template.subject}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {template.content}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Used {template.usage_count} times</span>
                          {template.hotkey && (
                            <div className="flex items-center space-x-1">
                              <Keyboard className="h-3 w-3" />
                              <span>/{template.hotkey}</span>
                            </div>
                          )}
                        </div>
                        
                        {template.approved_at && (
                          <div className="text-xs text-green-600 flex items-center">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Approved on {new Date(template.approved_at).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyTemplateContent(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Templates (Enterprise Managers only) */}
          {isEnterpriseManager && (
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Pending Approval</span>
                  </CardTitle>
                  <CardDescription>
                    Templates submitted by team members for company approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates(pendingTemplates).map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow border-orange-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{template.title}</CardTitle>
                            {getVisibilityBadge(template.visibility)}
                          </div>
                          {template.subject && (
                            <CardDescription className="font-medium text-gray-700">
                              Subject: {template.subject}
                            </CardDescription>
                          )}
                          <div className="text-sm text-gray-600">
                            By: {template.created_by} ({template.user_email})
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-gray-600 max-h-24 overflow-y-auto">
                            {template.content}
                          </div>
                          
                          {template.hotkey && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Keyboard className="h-3 w-3" />
                              <span>Hotkey: /{template.hotkey}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => approveTemplate(template.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectTemplate(template.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Extension Templates */}
          <TabsContent value="extension">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Keyboard className="h-5 w-5 text-purple-600" />
                  <span>Extension Templates</span>
                </CardTitle>
                <CardDescription>
                  Templates with hotkeys available in the Chrome extension for quick text expansion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extensionTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow border-purple-100">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            {template.source}
                          </Badge>
                        </div>
                        {template.subject && (
                          <CardDescription className="font-medium text-gray-700">
                            Subject: {template.subject}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {template.content}
                        </div>
                        
                        <div className="bg-purple-50 p-2 rounded border border-purple-200">
                          <div className="text-sm font-medium text-purple-700">
                            Extension Hotkey: /{template.hotkey}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            Type "/{template.hotkey}" in any email field to insert this template
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyTemplateContent(template)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {extensionTemplates.length === 0 && (
                  <div className="text-center py-8">
                    <Keyboard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500">No templates with hotkeys found</div>
                    <div className="text-sm text-gray-400 mt-2">
                      Add hotkeys to your templates to use them in the Chrome extension
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}