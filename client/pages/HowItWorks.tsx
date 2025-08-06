import { Monitor, Smartphone, Mail, Bot, Globe, Shield, Download, Settings, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Badge className="bg-blue-500 text-white">
              <Monitor className="h-3 w-3 mr-1" />
              Website
            </Badge>
            <Badge className="bg-green-500 text-white">
              <Download className="h-3 w-3 mr-1" />
              Extension
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h1>
          <p className="text-xl text-gray-600">
            Generate professional emails and replies in seconds using our website or browser extension
          </p>
        </div>
      </section>

      {/* Usage Options */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Two Ways to Use MailoReply AI
            </h2>
            <p className="text-xl text-gray-600">
              Choose the method that fits your workflow best
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Website Usage */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Website Application</CardTitle>
                <p className="text-gray-600">Use our web app for comprehensive email management</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Full Dashboard Access</h4>
                      <p className="text-sm text-gray-600">Complete interface with templates, settings, and analytics</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Advanced Features</h4>
                      <p className="text-sm text-gray-600">Access to all AI models, custom templates, and team features</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Usage Tracking</h4>
                      <p className="text-sm text-gray-600">Real-time usage monitoring and account management</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extension Usage */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Browser Extension</CardTitle>
                <p className="text-gray-600">Direct integration with your email client</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Gmail Integration</h4>
                      <p className="text-sm text-gray-600">Generate replies directly in Gmail without leaving your inbox</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Outlook Support</h4>
                      <p className="text-sm text-gray-600">Seamless integration with Outlook web and desktop</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Quick Access</h4>
                      <p className="text-sm text-gray-600">Generate responses with a single click</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide - Website */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Using the Website Application
            </h2>
            <p className="text-xl text-gray-600">
              Follow these simple steps to generate professional emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <div className="absolute top-10 left-1/2 transform translate-x-8 hidden md:block">
                  <div className="w-16 h-0.5 bg-blue-200"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Account</h3>
              <p className="text-gray-600 mb-4">
                Sign up for free in under 2 minutes. Choose your plan based on your needs.
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">✓ Secure registration</p>
                <p className="text-sm text-gray-500">✓ Device verification</p>
                <p className="text-sm text-gray-500">✓ Instant access</p>
              </div>
            </div>

            <div className="text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <div className="absolute top-10 left-1/2 transform translate-x-8 hidden md:block">
                  <div className="w-16 h-0.5 bg-green-200"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Input Your Content</h3>
              <p className="text-gray-600 mb-4">
                Paste the email you want to reply to, or describe the email you want to send.
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">✓ Reply to existing emails</p>
                <p className="text-sm text-gray-500">✓ Generate new emails</p>
                <p className="text-sm text-gray-500">✓ Set tone and intent</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Perfect Results</h3>
              <p className="text-gray-600 mb-4">
                Our AI generates professional content with the right tone and intent in seconds.
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">✓ Professional tone</p>
                <p className="text-sm text-gray-500">✓ Context-aware</p>
                <p className="text-sm text-gray-500">✓ Ready to send</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide - Extension */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Using the Browser Extension
            </h2>
            <p className="text-xl text-gray-600">
              Generate replies directly in your email client
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Install Extension</h3>
              <p className="text-gray-600 text-sm">
                Download from Chrome Web Store or Firefox Add-ons
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Account</h3>
              <p className="text-gray-600 text-sm">
                Sign in with your MailoReply AI credentials
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Email</h3>
              <p className="text-gray-600 text-sm">
                Click reply in Gmail or Outlook to see AI options
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Reply</h3>
              <p className="text-gray-600 text-sm">
                Click the AI button to generate instant replies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Feature Comparison
            </h2>
            <p className="text-xl text-gray-600">
              Both methods give you access to the same powerful AI capabilities
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Website</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Extension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">AI Email Generation</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">20+ Languages</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Custom Tones & Intents</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">End-to-End Encryption</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Usage Tracking</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Templates Management</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400">Limited</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Analytics Dashboard</td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400">View Only</span>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Direct Email Integration</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400">Copy/Paste</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Security & Privacy
            </h2>
            <p className="text-xl text-gray-600">
              Your data is protected with enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All content is encrypted on your device before transmission. We never see your plaintext emails.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Full compliance with EU data protection regulations. Your privacy rights are respected.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Zero Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We don't store your email content. All processing is real-time with immediate data purging.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Choose your preferred method and start generating professional emails today
          </p>

        </div>
      </section>
    </div>
  );
}
