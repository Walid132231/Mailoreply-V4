import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Copy, 
  Mail, 
  Reply, 
  Loader2, 
  Shield, 
  ShieldOff,
  Zap,
  AlertCircle,
  Lock,
  Unlock,
  Settings,
  Info
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/NewAuthContext';
import { UsageStatsCard } from '@/components/UsageIndicator';
import { generateAIReply, generateAIEmail, isN8NConfigured } from '@/lib/n8n-service';
import { trackGeneration, canUserGenerate, getUserUsageStats } from '@/lib/usage-tracking';
import { copyWithFeedback } from '@/lib/clipboard';
import { 
  LANGUAGES, 
  TONES, 
  INTENTS, 
  GenerationRequest, 
  Language, 
  Tone, 
  Intent,
  UsageStats 
} from '@/lib/supabase-types';

export default function AIGeneratorNew() {
  const { user, settings, updateSettings } = useAuth();
  
  // UI State
  const [generationType, setGenerationType] = useState<'reply' | 'email'>('reply');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [error, setError] = useState('');
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Form State
  const [originalMessage, setOriginalMessage] = useState('');
  const [emailPrompt, setEmailPrompt] = useState('');
  const [language, setLanguage] = useState<Language>('English');
  const [tone, setTone] = useState<Tone>('Professional');
  const [intent, setIntent] = useState<Intent>('Acknowledge Message');
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);

  // Load user settings and usage stats
  useEffect(() => {
    if (user && settings) {
      setLanguage(settings.default_language as Language);
      setTone(settings.default_tone as Tone);
      setEncryptionEnabled(settings.encryption_enabled);
      loadUsageStats();
    }
  }, [user, settings]);

  const loadUsageStats = async () => {
    if (user) {
      const stats = await getUserUsageStats(user.id);
      setUsageStats(stats);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;

    // Check if user can generate
    const canGenerate = await canUserGenerate(user.id);
    if (!canGenerate) {
      setError('You have reached your generation limit. Please upgrade your plan or wait for the next period.');
      return;
    }

    // Validate inputs
    if (generationType === 'reply' && !originalMessage.trim()) {
      setError('Please enter the original message to reply to.');
      return;
    }

    if (generationType === 'email' && !emailPrompt.trim()) {
      setError('Please enter what you want the email to be about.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedContent('');
    setGeneratedSubject('');

    try {
      const request: GenerationRequest = {
        source: 'website',
        generationType,
        language,
        tone,
        intent: generationType === 'reply' ? intent : undefined,
        originalMessage: generationType === 'reply' ? originalMessage : undefined,
        prompt: generationType === 'email' ? emailPrompt : undefined,
        encrypted: encryptionEnabled
      };

      let response;
      if (generationType === 'reply') {
        response = await generateAIReply(request);
      } else {
        response = await generateAIEmail(request);
      }

      if (response.success) {
        setGeneratedContent(response.content || '');
        setGeneratedSubject(response.subject || '');
        
        // Track successful generation
        await trackGeneration(request, true);
        
        // Refresh usage stats
        await loadUsageStats();
      } else {
        setError(response.error || 'Generation failed');
        await trackGeneration(request, false, response.error);
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = async () => {
    await copyWithFeedback(generatedContent);
  };

  const copySubject = async () => {
    await copyWithFeedback(generatedSubject);
  };

  const toggleEncryption = async () => {
    if (!settings?.always_encrypt) {
      const newValue = !encryptionEnabled;
      setEncryptionEnabled(newValue);
      
      if (updateSettings) {
        try {
          await updateSettings({ encryption_enabled: newValue });
        } catch (error) {
          console.error('Failed to update encryption setting:', error);
        }
      }
    }
  };

  const isEncryptionDisabled = settings?.always_encrypt || false;

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600 mt-1">Generate professional emails and replies with AI</p>
          </div>
          
          {!isN8NConfigured && (
            <Alert className="max-w-md border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                AI service not configured - email generation unavailable
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Generation Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Generation Type Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Generation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as 'reply' | 'email')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reply" className="flex items-center space-x-2">
                      <Reply className="h-4 w-4" />
                      <span>Reply to Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Write Email</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reply" className="space-y-4 mt-6">
                    <div>
                      <Label htmlFor="original-message">Original Message to Reply To</Label>
                      <Textarea
                        id="original-message"
                        placeholder="Paste the email you want to reply to here..."
                        value={originalMessage}
                        onChange={(e) => setOriginalMessage(e.target.value)}
                        rows={6}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4 mt-6">
                    <div>
                      <Label htmlFor="email-prompt">What should the email be about?</Label>
                      <Textarea
                        id="email-prompt"
                        placeholder="Describe what you want the email to say. For example: 'Schedule a meeting for next week to discuss the project proposal'"
                        value={emailPrompt}
                        onChange={(e) => setEmailPrompt(e.target.value)}
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Generation Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Generation Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Language */}
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
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

                  {/* Tone */}
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Intent (only for replies) */}
                  {generationType === 'reply' && (
                    <div className="md:col-span-2">
                      <Label htmlFor="intent">Intent</Label>
                      <Select value={intent} onValueChange={(value) => setIntent(value as Intent)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTENTS.map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Encryption Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {encryptionEnabled ? (
                      <Shield className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium">
                        {isEncryptionDisabled ? 'Always Encrypt (Enabled in Settings)' : 'Encrypt Content'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isEncryptionDisabled 
                          ? 'Encryption is always enabled in your settings' 
                          : 'Encrypt content before sending to AI service'
                        }
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={encryptionEnabled}
                    onCheckedChange={toggleEncryption}
                    disabled={isEncryptionDisabled}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || (!originalMessage.trim() && generationType === 'reply') || (!emailPrompt.trim() && generationType === 'email')}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate {generationType === 'reply' ? 'Reply' : 'Email'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generated Content */}
            {(generatedContent || generatedSubject) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-green-600" />
                    <span>Generated {generationType === 'reply' ? 'Reply' : 'Email'}</span>
                    {encryptionEnabled && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Lock className="h-3 w-3" />
                        <span>Encrypted</span>
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Subject Line (emails only) */}
                  {generationType === 'email' && generatedSubject && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Subject Line</Label>
                        <Button variant="outline" size="sm" onClick={copySubject}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Subject
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="font-medium">{generatedSubject}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Body */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{generationType === 'reply' ? 'Reply Content' : 'Email Content'}</Label>
                      <Button variant="outline" size="sm" onClick={copyContent}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Content
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border min-h-32">
                      <p className="whitespace-pre-wrap">{generatedContent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Usage Stats */}
            {usageStats && (
              <UsageStatsCard usage={usageStats} />
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {generationType === 'reply' ? (
                  <>
                    <p>�� Include the full context in the original message</p>
                    <p>• Choose the intent that best matches your desired response</p>
                    <p>• The AI will maintain the tone throughout the reply</p>
                    <p>• Encryption protects sensitive content during processing</p>
                  </>
                ) : (
                  <>
                    <p>• Be specific about what you want to communicate</p>
                    <p>• Include any important details or context</p>
                    <p>• The AI will generate both subject and body</p>
                    <p>• You can edit the generated content before sending</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardHeader>
                <CardTitle>Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <Badge variant="outline">{user.role.replace('_', ' ')}</Badge>
                  </div>
                  {usageStats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Daily Limit</span>
                        <span className="text-sm font-medium">
                          {usageStats.dailyLimit === -1 ? 'Unlimited' : usageStats.dailyLimit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Monthly Limit</span>
                        <span className="text-sm font-medium">
                          {usageStats.monthlyLimit === -1 ? 'Unlimited' : usageStats.monthlyLimit}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
