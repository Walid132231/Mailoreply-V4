import { Shield, Lock, Eye, Database, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Badge className="bg-green-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
            <Badge className="bg-blue-500 text-white">
              <Lock className="h-3 w-3 mr-1" />
              Zero Data Retention
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Your privacy is our priority. We don't store, retain, or access your email content.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Privacy Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Zero Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We don't store your email content. Messages are processed in real-time and immediately discarded after generation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  All communications are encrypted with AES-256-GCM before leaving your device. We never see your plaintext content.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>GDPR Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Full compliance with EU data protection regulations. You have complete control over your data and privacy settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Privacy Information */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            
            {/* Data We Don't Collect */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Don't Collect</h2>
              <div className="bg-white rounded-lg p-6 border">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Email Content:</strong> We never store, log, or retain the content of your emails or replies.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Personal Messages:</strong> Your private communications remain completely private.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Contact Information:</strong> We don't collect email addresses from your messages or contacts.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Browsing History:</strong> We don't track your browsing habits or online activity.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Data We Do Collect */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Do Collect</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-600 mb-4">We only collect the minimum data necessary to provide our service:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Account Information:</strong> Email address and encrypted password for account access.</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Usage Statistics:</strong> Anonymous usage counts for billing and service optimization (no content).</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>Device Information:</strong> Secure device fingerprints for device limit management (no personal data).</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                    <span className="text-gray-700"><strong>User Preferences:</strong> Language, tone, and encryption settings to improve your experience.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* How We Protect Your Data */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Protect Your Data</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Technical Safeguards</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• AES-256-GCM encryption</li>
                      <li>• TLS 1.3 for data in transit</li>
                      <li>• Secure key management</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Operational Safeguards</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Zero-trust architecture</li>
                      <li>• Access logging and monitoring</li>
                      <li>• Employee background checks</li>
                      <li>• Data minimization practices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Processing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Processing</h2>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold text-gray-900 mb-3">How Email Generation Works</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded mr-3 mt-0.5">1</span>
                    <span>Your email content is encrypted on your device before transmission</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded mr-3 mt-0.5">2</span>
                    <span>Encrypted data is sent to our AI processing service via secure channels</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded mr-3 mt-0.5">3</span>
                    <span>AI generates a response and encrypts it immediately</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded mr-3 mt-0.5">4</span>
                    <span>All temporary data is immediately purged from our systems</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Important:</strong> At no point do we store, log, or retain your email content. The processing is real-time and stateless.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Rights (GDPR) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights Under GDPR</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-600 mb-4">Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Access</h4>
                      <p className="text-sm text-gray-600">Request a copy of the data we hold about you</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Rectification</h4>
                      <p className="text-sm text-gray-600">Correct any inaccurate personal data</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Erasure</h4>
                      <p className="text-sm text-gray-600">Request deletion of your personal data</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Portability</h4>
                      <p className="text-sm text-gray-600">Export your data in a machine-readable format</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Object</h4>
                      <p className="text-sm text-gray-600">Object to processing of your personal data</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Right to Restrict</h4>
                      <p className="text-sm text-gray-600">Limit how we use your personal data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookies and Tracking */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">We use minimal, essential cookies for:</p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Authentication and session management</li>
                  <li>• User preferences and settings</li>
                  <li>• Security and fraud prevention</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-red-600">Never Retained</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Email content and messages</li>
                      <li>• Generated replies and emails</li>
                      <li>• Personal communications</li>
                      <li>• Temporary processing data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Retained as Needed</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Account information (until deletion)</li>
                      <li>• Usage statistics (anonymized)</li>
                      <li>• Device fingerprints (hashed)</li>
                      <li>• User preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or your data rights, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> privacy@mailoreply.ai</p>
                  <p><strong>Data Protection Officer:</strong> dpo@mailoreply.ai</p>
                  <p><strong>EU Representative:</strong> eu-rep@mailoreply.ai</p>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  We will respond to all privacy-related inquiries within 30 days as required by GDPR.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
