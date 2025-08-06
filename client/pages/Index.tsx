import { useState } from 'react';
import { StripeAPI } from '@/lib/stripe-api';
import { STRIPE_CONFIG } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check,
  Mail,
  Zap,
  Shield,
  BarChart3,
  Bot,
  Lock,
  Users,
  Globe,
  Monitor,
  Star,
  Smartphone,
  ChevronDown,
  TrendingUp,
  Gift,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Index() {
  const [isYearly, setIsYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePlanSelection = async (planType: 'free' | 'pro' | 'pro_plus' | 'enterprise') => {
    if (planType === 'free') {
      // Redirect to signup/login for free plan
      window.location.href = '/login';
      return;
    }

    if (planType === 'enterprise') {
      // Redirect to contact sales
      window.location.href = '/contact';
      return;
    }

    setLoadingPlan(planType);

    try {
      let priceId: string;

      if (planType === 'pro') {
        priceId = isYearly ? STRIPE_CONFIG.prices.PRO_YEARLY : STRIPE_CONFIG.prices.PRO_MONTHLY;
      } else if (planType === 'pro_plus') {
        priceId = isYearly ? STRIPE_CONFIG.prices.PRO_PLUS_YEARLY : STRIPE_CONFIG.prices.PRO_PLUS_MONTHLY;
      } else {
        throw new Error('Invalid plan type');
      }

      const sessionUrl = await StripeAPI.createCheckoutSession(priceId, isYearly);
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Badge className="bg-green-500 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  GDPR Compliant
                </Badge>
                <Badge className="bg-purple-500 text-white">
                  <Lock className="h-3 w-3 mr-1" />
                  End-to-End Encrypted
                </Badge>
              </div>
              
              <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-6">
                Write Better
                <br />
                <span className="text-blue-600">Emails</span> with
                <br />
                AI Assistance
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Generate professional emails and replies instantly. Our AI understands context, 
                tone, and intent to help you communicate more effectively.
              </p>
              

              
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
            
            {/* Email Preview Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 border">
                    <div className="text-sm text-gray-600 mb-3">Generated Email:</div>
                    <div className="text-base font-semibold mb-4 text-gray-900">
                      Subject: Following up on our meeting
                    </div>
                    <div className="text-gray-800 leading-relaxed">
                      Hi John,<br/><br/>
                      Thank you for taking the time to meet with me yesterday. I wanted to follow up on our discussion about the upcoming project...
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">AI Generated</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    Professional Tone
                  </Badge>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for professional communication
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple replies to complex campaigns, our platform handles it all with enterprise-grade security and intelligent device management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI Generation */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Smart AI Generation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Generate emails and replies with context-aware AI that understands tone, intent, and professional communication patterns.
                </p>
              </CardContent>
            </Card>

            {/* Multi-language */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">20+ Languages</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Communicate globally with support for English, Spanish, French, German, Chinese, Japanese, and many more languages.
                </p>
              </CardContent>
            </Card>

            {/* Enterprise Security */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  End-to-end encryption, GDPR compliance, and secure device management protect your communications at all times.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join 10,000+ professionals already saving 3+ hours per day with AI-powered email generation
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isYearly ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly 
                {isYearly && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <Gift className="h-3 w-3 mr-1" />
                    2 months FREE
                  </Badge>
                )}
              </span>
            </div>
            
            {isYearly && (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>Save up to $480 per year</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
            
            {/* Free Plan */}
            <Card className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gray-500 text-white text-xs">
                  STARTER
                </Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
                <p className="text-gray-600 text-sm">Perfect to get started</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 text-sm flex-1">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">3 emails per day</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">30 emails per month</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">1 device access</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Basic templates</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>
                <div className="pt-6 mt-auto">
                  <Button
                    onClick={() => handlePlanSelection('free')}
                    disabled={loadingPlan !== null}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  >
                    {loadingPlan === 'free' ? 'Loading...' : 'Get Started Free'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
              <div className="absolute top-4 right-4">
                <Badge className="bg-blue-500 text-white text-xs">
                  PROFESSIONAL
                </Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="space-y-1">
                  {isYearly ? (
                    <>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg text-gray-500 line-through">$5.99</span>
                        <Badge className="bg-red-500 text-white text-xs">-17%</Badge>
                      </div>
                      <div className="text-4xl font-bold text-blue-600">$4.99</div>
                      <p className="text-blue-600 text-sm font-semibold">per month, billed yearly</p>
                      <p className="text-gray-600 text-xs">Save $24/year</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-gray-900">$5.99</div>
                      <p className="text-gray-600 text-sm">per month</p>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 text-sm flex-1">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Unlimited</strong> daily emails</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">100 emails per month</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">1 device access</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Premium templates</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
                <div className="pt-6 mt-auto">
                  <Button
                    onClick={() => handlePlanSelection('pro')}
                    disabled={loadingPlan !== null}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  >
                    {loadingPlan === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plus Plan */}
            <Card className="relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 hover:border-purple-400 transition-all duration-300 hover:shadow-xl scale-105 z-10 h-full flex flex-col">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                <Badge className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold shadow-md">
                  <Star className="h-3 w-3 mr-1" />
                  MOST POPULAR
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-500 text-white text-xs">
                  BEST VALUE
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro Plus</h3>
                <div className="space-y-1">
                  {isYearly ? (
                    <>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg text-gray-500 line-through">$20.00</span>
                        <Badge className="bg-red-500 text-white text-xs">-17%</Badge>
                      </div>
                      <div className="text-4xl font-bold text-purple-600">$16.67</div>
                      <p className="text-purple-600 text-sm font-semibold">per month, billed yearly</p>
                      <p className="text-gray-600 text-xs">Save $80/year</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-gray-900">$20.00</div>
                      <p className="text-gray-600 text-sm">per month</p>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 text-sm flex-1">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Unlimited</strong> daily emails</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Unlimited</strong> monthly emails</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">2 device access</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Advanced templates</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Analytics dashboard</span>
                  </li>
                </ul>
                <div className="pt-6 mt-auto">
                  <Button
                    onClick={() => handlePlanSelection('pro_plus')}
                    disabled={loadingPlan !== null}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg"
                  >
                    {loadingPlan === 'pro_plus' ? 'Loading...' : 'Choose Pro Plus'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
              <div className="absolute top-4 right-4">
                <Badge className="bg-emerald-500 text-white text-xs">
                  ENTERPRISE
                </Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-1">Custom</div>
                <p className="text-gray-600 text-sm">For growing teams</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 text-sm flex-1">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Unlimited</strong> everything</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Unlimited devices</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Team management</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Custom templates</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Dedicated support</span>
                  </li>
                </ul>
                <div className="pt-6 mt-auto">
                  <Button
                    onClick={() => handlePlanSelection('enterprise')}
                    disabled={loadingPlan !== null}
                    variant="outline"
                    className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  >
                    {loadingPlan === 'enterprise' ? 'Loading...' : 'Contact Sales'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center space-x-8 text-gray-500 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>30-day money back</span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg inline-flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  +10k
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Join 10,000+ satisfied users</p>
                <p className="text-xs text-gray-600">Average 3+ hours saved per day</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to revolutionize your email workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who've already upgraded their communication with AI.
          </p>

          <p className="text-blue-100 text-sm mt-6">
            Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-white">MailoReply AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Write better emails with AI assistance. Professional communication made simple.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">GDPR</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 MailoReply AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
