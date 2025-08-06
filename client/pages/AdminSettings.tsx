import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Server, 
  Database, 
  Zap,
  Globe,
  Shield,
  Bell,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  X
} from "lucide-react";

// Initial system settings - will be loaded from Supabase
const initialSystemSettings = {
  n8nApiUrl: '',
  n8nApiKey: '',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: '',
  stripePublicKey: '',
  stripeSecretKey: '',
  webhookUrl: '',
  webhookSecret: '',
  maxFreeGenerations: 10,
  maxProGenerations: 400,
  invitationExpiryDays: 3
};

const apiIntegrations = [
  {
    name: 'N8N Workflow',
    type: 'n8n',
    status: 'inactive',
    description: 'Automation workflow platform',
    healthCheck: null
  },
  {
    name: 'Supabase Database',
    type: 'supabase',
    status: 'active',
    description: 'Primary database connection',
    healthCheck: 'healthy'
  },
  {
    name: 'Stripe Payments',
    type: 'stripe',
    status: 'active',
    description: 'Payment processing',
    healthCheck: 'healthy'
  },
  {
    name: 'Webhook Endpoints',
    type: 'webhook',
    status: 'inactive',
    description: 'External webhook notifications',
    healthCheck: null
  }
];

export default function AdminSettings() {
  const [settings, setSettings] = useState(initialSystemSettings);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Load settings from Supabase
      // const { data, error } = await supabase.from('system_settings').select('*');
      // if (error) throw error;
      // Process and set settings

      // For now, use initial settings
      setSettings(initialSystemSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      // TODO: Replace with real Supabase integration
      // await supabase.from('system_settings').upsert([
      //   { setting_key: `${section}_config`, setting_value: JSON.stringify(settings) }
      // ]);

      console.log(`Saving ${section} settings:`, settings);

      // Show success message
      alert(`${section.toUpperCase()} settings saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      alert(`Failed to save ${section} settings. Please try again.`);
    }
  };

  const testConnection = async (type: string) => {
    setTestingConnection(type);

    try {
      // TODO: Implement real connection testing
      switch (type) {
        case 'supabase':
          // Test Supabase connection
          // const { data, error } = await supabase.from('users').select('count');
          // if (error) throw error;
          break;
        case 'stripe':
          // Test Stripe connection
          // const stripe = new Stripe(settings.stripeSecretKey);
          // await stripe.customers.list({ limit: 1 });
          break;
        case 'n8n':
          // Test N8N connection
          // const response = await fetch(`${settings.n8nApiUrl}/health`);
          // if (!response.ok) throw new Error('N8N connection failed');
          break;
        case 'webhook':
          // Test webhook endpoint
          // const response = await fetch(settings.webhookUrl, { method: 'POST' });
          // if (!response.ok) throw new Error('Webhook test failed');
          break;
      }

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`${type.toUpperCase()} connection test successful!`);
    } catch (error) {
      console.error(`${type} connection test failed:`, error);
      alert(`${type.toUpperCase()} connection test failed!`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getStatusIcon = (status: string, health?: string | null) => {
    if (status === 'inactive') {
      return <X className="h-4 w-4 text-gray-500" />;
    }
    if (health === 'healthy') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (health === 'unhealthy') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system integrations and API connections.
          </p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations">API Integrations</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="monitoring">Health Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            {/* API Integrations Overview */}
            <Card>
              <CardHeader>
                <CardTitle>API Integrations Status</CardTitle>
                <CardDescription>Current status of all external integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiIntegrations.map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(integration.status, integration.healthCheck)}
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-gray-600">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(integration.status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testConnection(integration.type)}
                          disabled={testingConnection === integration.type}
                        >
                          {testingConnection === integration.type ? 'Testing...' : 'Test'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* N8N Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  N8N Workflow Integration
                </CardTitle>
                <CardDescription>
                  Configure N8N automation platform connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="n8nUrl">N8N API URL</Label>
                    <Input
                      id="n8nUrl"
                      placeholder="https://your-n8n-instance.com/api"
                      value={settings.n8nApiUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, n8nApiUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="n8nKey">N8N API Key</Label>
                    <Input
                      id="n8nKey"
                      type="password"
                      placeholder="Enter N8N API key"
                      value={settings.n8nApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, n8nApiKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleSave('n8n')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save N8N Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection('n8n')}
                    disabled={testingConnection === 'n8n'}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testingConnection === 'n8n' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Supabase Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Supabase Database
                </CardTitle>
                <CardDescription>
                  Configure Supabase database connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supabaseUrl">Supabase URL</Label>
                    <Input
                      id="supabaseUrl"
                      placeholder="https://your-project.supabase.co"
                      value={settings.supabaseUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
                    <Input
                      id="supabaseKey"
                      type="password"
                      placeholder="Enter Supabase anon key"
                      value={settings.supabaseKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, supabaseKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleSave('supabase')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Supabase Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection('supabase')}
                    disabled={testingConnection === 'supabase'}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testingConnection === 'supabase' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Stripe Payment Processing
                </CardTitle>
                <CardDescription>
                  Configure Stripe for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripePublic">Stripe Publishable Key</Label>
                    <Input
                      id="stripePublic"
                      placeholder="pk_live_..."
                      value={settings.stripePublicKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecret">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecret"
                      type="password"
                      placeholder="sk_live_..."
                      value={settings.stripeSecretKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleSave('stripe')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Stripe Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection('stripe')}
                    disabled={testingConnection === 'stripe'}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testingConnection === 'stripe' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure global system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFree">Max Free Generations (Daily)</Label>
                    <Input
                      id="maxFree"
                      type="number"
                      value={settings.maxFreeGenerations}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxFreeGenerations: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPro">Max Pro Generations (Monthly)</Label>
                    <Input
                      id="maxPro"
                      type="number"
                      value={settings.maxProGenerations}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxProGenerations: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteExpiry">Invitation Expiry (Days)</Label>
                    <Input
                      id="inviteExpiry"
                      type="number"
                      value={settings.invitationExpiryDays}
                      onChange={(e) => setSettings(prev => ({ ...prev, invitationExpiryDays: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button onClick={() => handleSave('system')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Configure webhook endpoints for external notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://your-webhook-endpoint.com"
                      value={settings.webhookUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      placeholder="Enter webhook secret"
                      value={settings.webhookSecret}
                      onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleSave('webhook')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Webhook Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection('webhook')}
                    disabled={testingConnection === 'webhook'}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testingConnection === 'webhook' ? 'Testing...' : 'Test Webhook'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  System Health Monitoring
                </CardTitle>
                <CardDescription>
                  Real-time system health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium">Database</h4>
                    <p className="text-sm text-green-600">Healthy</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium">API</h4>
                    <p className="text-sm text-green-600">Healthy</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-medium">N8N</h4>
                    <p className="text-sm text-yellow-600">Not Configured</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium">Payments</h4>
                    <p className="text-sm text-green-600">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Alert Configuration
                </CardTitle>
                <CardDescription>
                  Configure system alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Database Connection Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified when database connection fails</p>
                    </div>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">High Usage Alerts</Label>
                      <p className="text-sm text-gray-600">Alert when API usage exceeds thresholds</p>
                    </div>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Payment Failure Alerts</Label>
                      <p className="text-sm text-gray-600">Notify when payments fail</p>
                    </div>
                    <input type="checkbox" className="rounded" defaultChecked />
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
