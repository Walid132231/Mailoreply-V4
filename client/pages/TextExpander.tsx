import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Keyboard,
  Clock,
  Copy,
  Eye,
  Filter,
  Lock,
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { copyWithFeedback } from "@/lib/clipboard";

interface TextTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  hotkey?: string;
  createdAt: string;
  usageCount: number;
  lastUsed?: string;
  isPrivate?: boolean;
  sharedWithCompany?: boolean;
  createdBy?: string;
}

const TEMPLATE_CATEGORIES = [
  'Meeting',
  'Follow-up',
  'Thank You',
  'Apology',
  'Confirmation',
  'Request',
  'Update',
  'General'
];

const AVAILABLE_HOTKEYS = [
  'Ctrl+1', 'Ctrl+2', 'Ctrl+3', 'Ctrl+4', 'Ctrl+5',
  'Ctrl+6', 'Ctrl+7', 'Ctrl+8', 'Ctrl+9', 'Ctrl+0',
  'Ctrl+Shift+1', 'Ctrl+Shift+2', 'Ctrl+Shift+3',
  'Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5'
];

const getTextTemplates = (): TextTemplate[] => {
  const saved = localStorage.getItem('mailoreply_text_expander');
  if (saved) {
    return JSON.parse(saved);
  }
  
  const defaultTemplates: TextTemplate[] = [
    {
      id: '1',
      name: 'Meeting Follow-up',
      content: 'Hi [NAME],\\n\\nThank you for taking the time to meet with me today. I wanted to follow up on our discussion about [TOPIC].\\n\\nAs discussed, I will [ACTION] by [DATE]. Please let me know if you have any questions.\\n\\nBest regards,\\n[SIGNATURE]',
      category: 'Follow-up',
      hotkey: 'Ctrl+1',
      createdAt: '2024-01-15',
      usageCount: 34,
      lastUsed: '2024-01-20',
      isPrivate: false,
      sharedWithCompany: true,
      createdBy: 'Demo User'
    },
    {
      id: '2',
      name: 'Thank You',
      content: 'Hi [NAME],\\n\\nThank you so much for [REASON]. I really appreciate your [QUALITY] and support.\\n\\nLooking forward to [NEXT_STEP].\\n\\nBest regards,\\n[SIGNATURE]',
      category: 'Thank You',
      hotkey: 'Ctrl+2',
      createdAt: '2024-01-10',
      usageCount: 28,
      lastUsed: '2024-01-19',
      isPrivate: false,
      sharedWithCompany: true,
      createdBy: 'Demo User'
    },
    {
      id: '3',
      name: 'Quick Yes',
      content: 'Yes, that sounds great! I\\\'ll take care of it.',
      category: 'General',
      hotkey: 'Ctrl+3',
      createdAt: '2024-01-12',
      usageCount: 22,
      lastUsed: '2024-01-18',
      isPrivate: true,
      sharedWithCompany: false,
      createdBy: 'Demo User'
    }
  ];
  
  localStorage.setItem('mailoreply_text_expander', JSON.stringify(defaultTemplates));
  return defaultTemplates;
};

export default function TextExpander() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TextTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    hotkey: '',
    isPrivate: false,
    sharedWithCompany: false
  });

  useEffect(() => {
    setTemplates(getTextTemplates());
  }, []);

  const saveTemplates = (newTemplates: TextTemplate[]) => {
    localStorage.setItem('mailoreply_text_expander', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPrivacy = !showPrivateOnly || template.isPrivate;
    return matchesSearch && matchesCategory && matchesPrivacy;
  });

  const getUsedHotkeys = () => templates.map(t => t.hotkey).filter(Boolean);
  const getAvailableHotkeys = () => AVAILABLE_HOTKEYS.filter(key => !getUsedHotkeys().includes(key));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData: TextTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name,
      content: formData.content,
      category: formData.category,
      hotkey: formData.hotkey || undefined,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      usageCount: editingTemplate?.usageCount || 0,
      lastUsed: editingTemplate?.lastUsed,
      isPrivate: formData.isPrivate,
      sharedWithCompany: user?.plan === 'enterprise' ? formData.sharedWithCompany : false,
      createdBy: user?.name || 'Unknown'
    };

    if (editingTemplate) {
      const updatedTemplates = templates.map(t => t.id === editingTemplate.id ? templateData : t);
      saveTemplates(updatedTemplates);
    } else {
      saveTemplates([...templates, templateData]);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      content: '', 
      category: '', 
      hotkey: '',
      isPrivate: false,
      sharedWithCompany: false
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: TextTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      hotkey: template.hotkey || '',
      isPrivate: template.isPrivate || false,
      sharedWithCompany: template.sharedWithCompany || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this text template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      saveTemplates(updatedTemplates);
    }
  };

  const handleCopy = async (content: string) => {
    const success = await copyWithFeedback(content);
    if (success) {
      // Simple feedback mechanism
      const event = new CustomEvent('template-copied');
      window.dispatchEvent(event);
    }
  };

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const privateTemplates = templates.filter(t => t.isPrivate).length;
  const sharedTemplates = templates.filter(t => t.sharedWithCompany).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Text Expander</h1>
            <p className="text-gray-600 mt-1">
              Create text templates with hotkey shortcuts for instant expansion.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 'Update your text template.' : 'Create a new text template with hotkey shortcut.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Meeting Follow-up"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hotkey">Hotkey (Optional)</Label>
                  <Select 
                    value={formData.hotkey}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hotkey: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotkey" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No hotkey</SelectItem>
                      {editingTemplate && editingTemplate.hotkey && (
                        <SelectItem value={editingTemplate.hotkey}>{editingTemplate.hotkey}</SelectItem>
                      )}
                      {getAvailableHotkeys().map(hotkey => (
                        <SelectItem key={hotkey} value={hotkey}>
                          <span className="font-mono">{hotkey}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Template Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your text template content. Use [VARIABLE] for dynamic content."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like [NAME], [DATE], [TOPIC] for dynamic content
                  </p>
                </div>

                {/* Privacy Controls */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Private Template</Label>
                      <p className="text-xs text-gray-500">Only you can see and use this template</p>
                    </div>
                    <Switch
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                    />
                  </div>

                  {user?.plan === 'enterprise' && !formData.isPrivate && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Share with Company</Label>
                        <p className="text-xs text-gray-500">Other team members can see and use this template</p>
                      </div>
                      <Switch
                        checked={formData.sharedWithCompany}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sharedWithCompany: checked }))}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <Keyboard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold">{totalUsage}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Private</p>
                  <p className="text-2xl font-bold">{privateTemplates}</p>
                </div>
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          {user?.plan === 'enterprise' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shared</p>
                    <p className="text-2xl font-bold">{sharedTemplates}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showPrivateOnly}
                onCheckedChange={setShowPrivateOnly}
              />
              <Label className="text-sm">Private only</Label>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Keyboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' || showPrivateOnly
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first text template to get started.'}
              </p>
              {!searchTerm && selectedCategory === 'all' && !showPrivateOnly && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Template
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isPrivate && <Lock className="h-4 w-4 text-purple-600" />}
                        {template.sharedWithCompany && <Users className="h-4 w-4 text-orange-600" />}
                      </CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{template.category}</Badge>
                    {template.hotkey && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {template.hotkey}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {template.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Used {template.usageCount} times</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(template.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewTemplate?.name}
                {previewTemplate?.isPrivate && <Lock className="h-4 w-4 text-purple-600" />}
                {previewTemplate?.sharedWithCompany && <Users className="h-4 w-4 text-orange-600" />}
              </DialogTitle>
              <DialogDescription>Template Preview</DialogDescription>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                <div>
                  <Label>Template Content</Label>
                  <div className="bg-gray-50 rounded-lg p-3 mt-1">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {previewTemplate.content}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleCopy(previewTemplate.content)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Content
                  </Button>
                  <Button onClick={() => handleEdit(previewTemplate)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
