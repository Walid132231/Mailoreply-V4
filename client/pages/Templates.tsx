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
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/NewAuthContext";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  Filter,
  Mail,
  FileText,
  Star,
  Globe,
  Lock
} from "lucide-react";

export default function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Mock templates data (replace with actual data fetching)
  const mockTemplates = [
    {
      id: "1",
      name: "Welcome Email",
      category: "Welcome",
      visibility: "private",
      content: "Welcome to our platform! We're excited to have you on board...",
      variables: ["firstName", "companyName"],
      language: "English",
      tone: "Friendly",
      created_at: "2025-01-01T10:00:00Z",
      is_favorite: true
    },
    {
      id: "2", 
      name: "Follow-up Email",
      category: "Follow-up",
      visibility: "public",
      content: "Thank you for your interest in our services. I wanted to follow up...",
      variables: ["firstName", "productName"],
      language: "English", 
      tone: "Professional",
      created_at: "2025-01-02T14:30:00Z",
      is_favorite: false
    },
    {
      id: "3",
      name: "Meeting Request",
      category: "Meeting",
      visibility: "private", 
      content: "I hope this email finds you well. I would like to schedule a meeting...",
      variables: ["firstName", "meetingDate", "meetingTime"],
      language: "English",
      tone: "Formal",
      created_at: "2025-01-03T09:15:00Z",
      is_favorite: true
    }
  ];

  useEffect(() => {
    // In a real app, fetch templates from API
    setTemplates(mockTemplates);
    setFilteredTemplates(mockTemplates);
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(template => template.category === filterCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, filterCategory]);

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleToggleFavorite = (templateId) => {
    setTemplates(templates.map(t => 
      t.id === templateId ? { ...t, is_favorite: !t.is_favorite } : t
    ));
  };

  const handleCopyTemplate = (template) => {
    navigator.clipboard.writeText(template.content);
    // Add toast notification here
  };

  const categories = ["all", "Welcome", "Follow-up", "Meeting", "Sales", "Support"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">
              Create and manage email templates for faster composition
            </p>
          </div>
          <Button onClick={handleCreateTemplate} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.category}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(template.id)}
                      className={template.is_favorite ? "text-yellow-500" : "text-gray-400"}
                    >
                      <Star className={`h-4 w-4 ${template.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                    {template.visibility === "public" ? (
                      <Globe className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {template.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{template.language}</span>
                  <span>{template.tone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
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
                  <Badge variant="outline" className="text-xs">
                    {new Date(template.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterCategory !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Get started by creating your first template"}
            </p>
            {(!searchTerm && filterCategory === "all") && (
              <Button onClick={handleCreateTemplate} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </Card>
        )}

        {/* Template Creation/Edit Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? "Modify your template details and content"
                  : "Create a reusable email template with dynamic variables"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    defaultValue={editingTemplate?.name || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue={editingTemplate?.category || "Welcome"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue={editingTemplate?.language || "English"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select defaultValue={editingTemplate?.tone || "Professional"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select defaultValue={editingTemplate?.visibility || "private"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Template Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your email template content. Use {variableName} for dynamic variables."
                  className="min-h-[150px]"
                  defaultValue={editingTemplate?.content || ""}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use curly braces for variables, e.g., {`{firstName}`}, {`{companyName}`}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}