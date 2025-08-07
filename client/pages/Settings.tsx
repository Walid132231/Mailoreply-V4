import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  User, 
  Bell, 
  Key, 
  Monitor, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Info,
  Settings as SettingsIcon,
  Globe,
  Smartphone,
  Crown
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/NewAuthContext';
import { getUserDevices, removeDevice } from '@/lib/usage-tracking';
import { LANGUAGES, TONES, Language, Tone, UserDevice } from '@/lib/supabase-types';
import SubscriptionManager from '@/components/SubscriptionManager';

export default function Settings() {
  const { user, settings, updateUser, updateSettings } = useAuth();
  
  // Local state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('English');
  const [defaultTone, setDefaultTone] = useState<Tone>('Professional');
  const [alwaysEncrypt, setAlwaysEncrypt] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      loadDevices();
    }
    
    if (settings) {
      setDefaultLanguage(settings.default_language as Language);
      setDefaultTone(settings.default_tone as Tone);
      setAlwaysEncrypt(settings.always_encrypt);
      setEncryptionEnabled(settings.encryption_enabled);
    }
  }, [user, settings]);

  const loadDevices = async () => {
    if (!user) return;
    
    setLoadingDevices(true);
    try {
      const userDevices = await getUserDevices(user.id);
      setDevices(userDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !updateUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUser({
        name,
        email,
      });
      setSuccess('Profile updated successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!settings || !updateSettings) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateSettings({
        default_language: defaultLanguage,
        default_tone: defaultTone,
        always_encrypt: alwaysEncrypt,
        encryption_enabled: alwaysEncrypt ? true : encryptionEnabled, // Force enable if always encrypt
      });
      setSuccess('Preferences updated successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device? You will need to log in again on that device.')) {
      return;
    }

    try {
      const success = await removeDevice(deviceId);
      if (success) {
        setDevices(devices.filter(d => d.id !== deviceId));
        setSuccess('Device removed successfully');
      } else {
        setError('Failed to remove device');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to remove device');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setError('');
    setSuccess('');

    try {
      // Import supabase from the lib
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        throw new Error('Authentication service not available');
      }

      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('mobile') || name.includes('phone') || name.includes('android') || name.includes('ios')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please log in to access settings</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Devices</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <Crown className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your account information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Account Role</span>
                      <Badge variant="outline">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Contact your administrator to change your role
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>AI Generation Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Set your default preferences for AI email generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="default-language" className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Default Language</span>
                      </Label>
                      <Select value={defaultLanguage} onValueChange={(value) => setDefaultLanguage(value as Language)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default-tone">Default Tone</Label>
                      <Select value={defaultTone} onValueChange={(value) => setDefaultTone(value as Tone)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONES.map((tone) => (
                            <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSavePreferences} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Control how you receive notifications and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Usage Limit Warnings</div>
                        <div className="text-sm text-gray-600">
                          Get notified when approaching your daily/monthly limits
                        </div>
                      </div>
                      <Switch
                        checked={true}
                        disabled
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Security Alerts</div>
                        <div className="text-sm text-gray-600">
                          Receive notifications about login attempts and security events
                        </div>
                      </div>
                      <Switch
                        checked={true}
                        disabled
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Feature Updates</div>
                        <div className="text-sm text-gray-600">
                          Get updates about new features and improvements
                        </div>
                      </div>
                      <Switch
                        checked={true}
                        disabled
                      />
                    </div>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Notification preferences will be fully configurable in a future update. 
                      Currently, essential security and limit notifications are always enabled.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              
              {/* Encryption Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Encryption Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Control how your data is encrypted during AI processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Always Encrypt */}
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium text-red-900">Always Encrypt</div>
                        <div className="text-sm text-red-700">
                          When enabled, all content will be encrypted before sending to AI services
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={alwaysEncrypt}
                      onCheckedChange={setAlwaysEncrypt}
                    />
                  </div>

                  {/* Regular Encryption (disabled if always encrypt is on) */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    alwaysEncrypt 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Shield className={`h-5 w-5 ${alwaysEncrypt ? 'text-gray-400' : 'text-blue-600'}`} />
                      <div>
                        <div className={`font-medium ${alwaysEncrypt ? 'text-gray-500' : 'text-blue-900'}`}>
                          Enable Encryption by Default
                        </div>
                        <div className={`text-sm ${alwaysEncrypt ? 'text-gray-400' : 'text-blue-700'}`}>
                          {alwaysEncrypt 
                            ? 'Automatically enabled when "Always Encrypt" is on'
                            : 'Enable encryption toggle by default in AI generator'
                          }
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={alwaysEncrypt || encryptionEnabled}
                      onCheckedChange={setEncryptionEnabled}
                      disabled={alwaysEncrypt}
                    />
                  </div>

                  {alwaysEncrypt && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        With "Always Encrypt" enabled, the encryption toggle in the AI generator will be disabled 
                        and show "Always Encrypt (Enabled in Settings)" with a lock icon.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">How Encryption Works</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Content is encrypted using AES-256-GCM before being sent to AI services</li>
                      <li>• Encryption keys are managed securely in your browser</li>
                      <li>• AI services never receive your plain text content</li>
                      <li>• Responses are decrypted locally before being displayed</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSavePreferences} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Security Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Active Devices</span>
                </CardTitle>
                <CardDescription>
                  Manage devices that have access to your account. You can have up to {user.device_limit === -1 ? 'unlimited' : user.device_limit} active device{user.device_limit !== 1 ? 's' : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDevices ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading devices...</div>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active devices found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getDeviceIcon(device.device_name || '')}
                          <div>
                            <div className="font-medium">
                              {device.device_name || 'Unknown Device'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Last active: {new Date(device.last_active).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                          
                          {devices.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveDevice(device.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Device limit info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Device Usage</div>
                          <div className="text-sm text-gray-600">
                            {devices.length} of {user.device_limit === -1 ? 'unlimited' : user.device_limit} devices
                          </div>
                        </div>
                        
                        {user.device_limit > 0 && (
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                devices.length >= user.device_limit ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((devices.length / user.device_limit) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-2"
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-2"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-2"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Password Requirements</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Minimum 6 characters long</li>
                      <li>• Use a combination of letters, numbers, and special characters</li>
                      <li>• Avoid using easily guessable information</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handlePasswordChange} 
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {passwordLoading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Account Information</span>
                  </CardTitle>
                  <CardDescription>
                    View your account details and subscription status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Account Type</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-sm">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                      <div className="mt-1 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Account Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant="outline" 
                          className={user.status === 'active' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}
                        >
                          {user.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    {user.company_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Company</Label>
                        <div className="mt-1 text-sm">
                          {user.company_name}
                        </div>
                      </div>
                    )}
                  </div>

                  {user.role === 'free' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-900">Upgrade Your Account</div>
                          <div className="text-sm text-blue-700 mt-1">
                            Get unlimited daily usage, advanced features, and priority support
                          </div>
                          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                            View Upgrade Options
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-red-900">Delete Account</div>
                          <div className="text-sm text-red-700 mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setError('Account deletion is not available yet. Please contact support.')}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              <SubscriptionManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
