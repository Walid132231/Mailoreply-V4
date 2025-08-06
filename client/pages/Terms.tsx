import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Badge className="bg-blue-500 text-white">
              <Scale className="h-3 w-3 mr-1" />
              Legal Terms
            </Badge>
            <Badge className="bg-green-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              User Protection
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Use
          </h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using MailoReply AI services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">

            {/* Acceptance of Terms */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  By accessing and using MailoReply AI ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-700">
                  These Terms of Use constitute a legally binding agreement between you and MailoReply AI regarding your use of the Service.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  MailoReply AI provides artificial intelligence-powered email generation and reply services through:
                </p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Web-based application accessible via browser</li>
                  <li>Browser extension for direct email client integration</li>
                  <li>API services for developers and integrations</li>
                  <li>Mobile applications (when available)</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Service features and availability may vary based on your subscription plan and geographic location.
                  </p>
                </div>
              </div>
            </div>

            {/* User Accounts and Registration */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold text-gray-900 mb-3">Account Requirements</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside mb-4">
                  <li>You must be at least 18 years old to create an account</li>
                  <li>You must provide accurate and complete registration information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                </ul>
                
                <h3 className="font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Keep your login credentials confidential</li>
                  <li>Use strong, unique passwords</li>
                  <li>Log out from shared computers</li>
                  <li>Report suspected security breaches immediately</li>
                </ul>
              </div>
            </div>

            {/* Usage Limits and Device Management */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Usage Limits and Device Management</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Usage Limits</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li><strong>Free:</strong> 3/day, 30/month</li>
                      <li><strong>Pro:</strong> Unlimited/day, 100/month</li>
                      <li><strong>Pro Plus:</strong> Unlimited</li>
                      <li><strong>Enterprise:</strong> Unlimited</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Device Limits</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li><strong>Free & Pro:</strong> 1 device</li>
                      <li><strong>Pro Plus:</strong> 2 devices</li>
                      <li><strong>Enterprise:</strong> Unlimited devices</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    <strong>Fair Use:</strong> All plans are subject to fair use policies. Excessive usage may result in temporary limitations.
                  </p>
                </div>
              </div>
            </div>

            {/* Acceptable Use Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold text-gray-900 mb-3">You agree NOT to use the Service to:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prohibited Content</h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      <li>Generate spam or unwanted emails</li>
                      <li>Create harassing or threatening content</li>
                      <li>Produce illegal or harmful content</li>
                      <li>Violate intellectual property rights</li>
                      <li>Generate misleading information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technical Restrictions</h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      <li>Attempt to reverse engineer the service</li>
                      <li>Bypass usage limits or device restrictions</li>
                      <li>Use automated tools or scripts</li>
                      <li>Interfere with service infrastructure</li>
                      <li>Access unauthorized data or accounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy and Data Protection */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  Your privacy is fundamental to our service. We are committed to:
                </p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside mb-4">
                  <li>Never storing or retaining your email content</li>
                  <li>Processing all data with end-to-end encryption</li>
                  <li>Complying with GDPR and other privacy regulations</li>
                  <li>Providing transparent data handling practices</li>
                </ul>
                <p className="text-gray-700">
                  For detailed information about data handling, please review our 
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 ml-1">Privacy Policy</a>.
                </p>
              </div>
            </div>

            {/* Subscription and Billing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Subscription and Billing</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Subscription Terms</h3>
                    <ul className="space-y-2 text-gray-700 list-disc list-inside">
                      <li>Subscriptions are billed monthly or annually as selected</li>
                      <li>All fees are non-refundable except as required by law</li>
                      <li>Prices may change with 30 days notice</li>
                      <li>Subscriptions auto-renew unless cancelled</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cancellation</h3>
                    <ul className="space-y-2 text-gray-700 list-disc list-inside">
                      <li>You may cancel your subscription at any time</li>
                      <li>Service continues until the end of your billing period</li>
                      <li>No partial refunds for unused subscription time</li>
                      <li>Free plan users may delete their account anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Our Rights</h3>
                    <p className="text-gray-700">
                      MailoReply AI and all related trademarks, logos, and content are our property. 
                      You may not use our intellectual property without express written permission.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
                    <p className="text-gray-700">
                      You retain full ownership of all content you input into the service and all 
                      generated content. We claim no rights to your emails or generated content.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI-Generated Content</h3>
                    <p className="text-gray-700">
                      While you own the generated content, you are responsible for ensuring it 
                      complies with applicable laws and does not infringe third-party rights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Availability */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Availability</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  We strive to provide reliable service but cannot guarantee:
                </p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>100% uptime or uninterrupted service</li>
                  <li>Error-free operation at all times</li>
                  <li>Compatibility with all devices or software</li>
                  <li>Availability in all geographic regions</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-600">
                    We perform regular maintenance and updates which may temporarily affect service availability.
                  </p>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, MAILOREPLY AI SHALL NOT BE LIABLE FOR:
                  </p>
                  <ul className="space-y-2 text-gray-700 list-disc list-inside">
                    <li>Any indirect, incidental, special, or consequential damages</li>
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Damages resulting from third-party actions</li>
                    <li>Any damages exceeding the amount paid for the service</li>
                  </ul>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Important:</strong> You are responsible for verifying all AI-generated content before use. 
                      We are not liable for consequences of using generated content.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
              <div className="bg-white rounded-lg p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">By You</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      <li>Cancel subscription anytime</li>
                      <li>Delete account through settings</li>
                      <li>Export data before deletion</li>
                      <li>No cancellation fees</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">By Us</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      <li>Violation of terms</li>
                      <li>Suspected fraudulent activity</li>
                      <li>Non-payment of fees</li>
                      <li>Legal requirements</li>
                    </ul>
                  </div>
                </div>
                <p className="text-gray-700 mt-4">
                  Upon termination, your access to the service will cease immediately, and any data 
                  stored in your account may be deleted.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  We may update these Terms of Use from time to time. When we do:
                </p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>We will notify you via email or in-app notification</li>
                  <li>Changes will be effective 30 days after notification</li>
                  <li>Continued use constitutes acceptance of new terms</li>
                  <li>You may terminate your account if you disagree with changes</li>
                </ul>
              </div>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700">
                  These Terms of Use shall be governed by and construed in accordance with the laws 
                  of [Your Jurisdiction], without regard to its conflict of law provisions. Any 
                  disputes arising under these terms shall be subject to the exclusive jurisdiction 
                  of the courts of [Your Jurisdiction].
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <div className="bg-white rounded-lg p-6 border">
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Use, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@mailoreply.ai</p>
                  <p><strong>Support:</strong> support@mailoreply.ai</p>
                  <p><strong>Address:</strong> [Your Business Address]</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
