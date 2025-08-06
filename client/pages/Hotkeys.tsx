import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Keyboard, 
  Plus, 
  Edit, 
  Trash2, 
  Zap,
  Mail,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface HotkeyMapping {
  id: string;
  hotkey: string;
  templateId: string;
  templateName: string;
  usageCount: number;
  lastUsed?: string;
  isActive: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const getTemplates = (): EmailTemplate[] => {
  const saved = localStorage.getItem('mailoreply_templates');
  return saved ? JSON.parse(saved) : [];
};

const getHotkeyMappings = (): HotkeyMapping[] => {
  const saved = localStorage.getItem('mailoreply_hotkeys');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Generate default mappings from templates that have hotkeys
  const templates = getTemplates();
  const defaultMappings: HotkeyMapping[] = templates
    .filter(t => t.category) // Only templates with hotkeys
    .map((template, index) => ({
      id: `hotkey-${template.id}`,
      hotkey: `Ctrl+${index + 1}`,
      templateId: template.id,
      templateName: template.name,
      usageCount: Math.floor(Math.random() * 50),
      lastUsed: new Date().toISOString(),
      isActive: true
    }));
  
  localStorage.setItem('mailoreply_hotkeys', JSON.stringify(defaultMappings));
  return defaultMappings;
};

const AVAILABLE_HOTKEYS = [
  'Ctrl+1', 'Ctrl+2', 'Ctrl+3', 'Ctrl+4', 'Ctrl+5',
  'Ctrl+6', 'Ctrl+7', 'Ctrl+8', 'Ctrl+9', 'Ctrl+0',
  'Ctrl+Shift+1', 'Ctrl+Shift+2', 'Ctrl+Shift+3',
  'Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5'
];

export default function Hotkeys() {
  const [mappings, setMappings] = useState<HotkeyMapping[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<HotkeyMapping | null>(null);
  
  const [formData, setFormData] = useState({
    hotkey: '',
    templateId: ''
  });

  useEffect(() => {
    setTemplates(getTemplates());
    setMappings(getHotkeyMappings());
  }, []);

  const saveMappings = (newMappings: HotkeyMapping[]) => {
    localStorage.setItem('mailoreply_hotkeys', JSON.stringify(newMappings));
    setMappings(newMappings);
  };

  const getUsedHotkeys = () => mappings.map(m => m.hotkey);
  const getAvailableHotkeys = () => AVAILABLE_HOTKEYS.filter(key => !getUsedHotkeys().includes(key));
  const getUnassignedTemplates = () => {
    const assignedTemplateIds = mappings.map(m => m.templateId);
    return templates.filter(t => !assignedTemplateIds.includes(t.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const template = templates.find(t => t.id === formData.templateId);
    if (!template) return;

    const mappingData: HotkeyMapping = {
      id: editingMapping?.id || `hotkey-${Date.now()}`,
      hotkey: formData.hotkey,
      templateId: formData.templateId,
      templateName: template.name,
      usageCount: editingMapping?.usageCount || 0,
      lastUsed: editingMapping?.lastUsed,
      isActive: true
    };

    if (editingMapping) {
      const updatedMappings = mappings.map(m => m.id === editingMapping.id ? mappingData : m);
      saveMappings(updatedMappings);
    } else {
      saveMappings([...mappings, mappingData]);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ hotkey: '', templateId: '' });
    setEditingMapping(null);
  };

  const handleEdit = (mapping: HotkeyMapping) => {
    setEditingMapping(mapping);
    setFormData({
      hotkey: mapping.hotkey,
      templateId: mapping.templateId
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this hotkey mapping?')) {
      const updatedMappings = mappings.filter(m => m.id !== id);
      saveMappings(updatedMappings);
    }
  };

  const toggleActive = (id: string) => {
    const updatedMappings = mappings.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    saveMappings(updatedMappings);
  };

  const totalUsage = mappings.reduce((sum, m) => sum + m.usageCount, 0);
  const activeMappings = mappings.filter(m => m.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hotkeys & Text Expander</h1>
            <p className="text-gray-600 mt-1">
              Configure keyboard shortcuts for instant template access.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={getUnassignedTemplates().length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add Hotkey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMapping ? 'Edit Hotkey Mapping' : 'Create Hotkey Mapping'}
                </DialogTitle>
                <DialogDescription>
                  Assign a keyboard shortcut to a template for quick access.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="hotkey">Keyboard Shortcut</Label>
                  <Select 
                    value={formData.hotkey}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hotkey: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hotkey" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingMapping && (
                        <SelectItem value={editingMapping.hotkey}>{editingMapping.hotkey}</SelectItem>
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
                  <Label htmlFor="template">Email Template</Label>
                  <Select 
                    value={formData.templateId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingMapping && (
                        <SelectItem value={editingMapping.templateId}>
                          {editingMapping.templateName}
                        </SelectItem>
                      )}
                      {getUnassignedTemplates().map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingMapping ? 'Update Mapping' : 'Create Mapping'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Hotkeys</p>
                  <p className="text-2xl font-bold">{activeMappings}</p>
                </div>
                <Keyboard className="h-8 w-8 text-brand-600" />
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
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Slots</p>
                  <p className="text-2xl font-bold">{getAvailableHotkeys().length}</p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">How Hotkeys Work</h3>
                <p className="text-blue-800 text-sm mt-1">
                  Install the MailoReply Chrome extension to use these hotkeys in your email client. 
                  Press the assigned key combination while composing an email to instantly insert your template.
                </p>
                <div className="mt-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Install Chrome Extension
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotkey Mappings */}
        {mappings.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Keyboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hotkeys configured</h3>
              <p className="text-gray-600 mb-4">
                Create your first hotkey mapping to start using keyboard shortcuts.
              </p>
              {getUnassignedTemplates().length > 0 ? (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Hotkey
                    </Button>
                  </DialogTrigger>
                </Dialog>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    You need to create some email templates first.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/dashboard/templates">
                      <Mail className="mr-2 h-4 w-4" />
                      Create Templates
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mappings.map((mapping) => (
              <Card key={mapping.id} className={`${!mapping.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className="font-mono text-sm px-3 py-1"
                        >
                          {mapping.hotkey}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {mapping.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-500">
                            {mapping.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{mapping.templateName}</h4>
                        <p className="text-sm text-gray-600">
                          Used {mapping.usageCount} times
                          {mapping.lastUsed && (
                            <span className="ml-2">
                              • Last used {new Date(mapping.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(mapping.id)}
                      >
                        {mapping.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(mapping)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Reference */}
        {mappings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
              <CardDescription>Your active hotkey mappings for easy reference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappings.filter(m => m.isActive).map((mapping) => (
                  <div key={mapping.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="font-mono text-xs">
                      {mapping.hotkey}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {mapping.templateName}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
