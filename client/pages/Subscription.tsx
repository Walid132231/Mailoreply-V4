import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Users, Crown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionManager from '@/components/SubscriptionManager';

export default function Subscription() {
  const upgradePlans = [
    {
      name: 'Pro',
      icon: Zap,
      price: '$5.99/month',
      yearlyPrice: '$4.99/month (billed yearly)',
      description: 'Perfect for individuals and professionals',
      features: [
        'Unlimited daily emails',
        '100 emails per month',
        'Premium templates',
        'Priority support'
      ],
      color: 'blue',
      popular: false
    },
    {
      name: 'Pro Plus',
      icon: Crown,
      price: '$20.00/month',
      yearlyPrice: '$16.67/month (billed yearly)',
      description: 'Best value for power users',
      features: [
        'Unlimited everything',
        '2 device access',
        'Advanced templates',
        'Analytics dashboard',
        'Priority support'
      ],
      color: 'purple',
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Users,
      price: 'Custom pricing',
      yearlyPrice: 'Contact sales',
      description: 'For teams and organizations',
      features: [
        'Unlimited everything',
        'Unlimited devices',
        'Team management',
        'Custom templates',
        'Dedicated support'
      ],
      color: 'emerald',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600">Manage your subscription, billing, and plan features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Management */}
          <div className="lg:col-span-2">
            <SubscriptionManager />
          </div>

          {/* Upgrade Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Upgrade Your Plan</span>
                </CardTitle>
                <CardDescription>
                  Get more features and higher limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upgradePlans.map((plan) => {
                  const IconComponent = plan.icon;
                  return (
                    <div
                      key={plan.name}
                      className={`relative p-4 border-2 rounded-lg transition-all duration-300 hover:shadow-md ${
                        plan.popular 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-4 bg-purple-600 text-white">
                          Most Popular
                        </Badge>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          plan.color === 'blue' ? 'bg-blue-100' :
                          plan.color === 'purple' ? 'bg-purple-100' :
                          'bg-emerald-100'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            plan.color === 'blue' ? 'text-blue-600' :
                            plan.color === 'purple' ? 'text-purple-600' :
                            'text-emerald-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                          
                          <div className="mb-3">
                            <p className="font-bold text-gray-900">{plan.price}</p>
                            {plan.yearlyPrice !== plan.price && (
                              <p className="text-xs text-gray-500">{plan.yearlyPrice}</p>
                            )}
                          </div>
                          
                          <ul className="text-xs text-gray-600 space-y-1 mb-3">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-gray-500">+ {plan.features.length - 3} more</li>
                            )}
                          </ul>
                          
                          <Button
                            size="sm"
                            className={`w-full ${
                              plan.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                              plan.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                              'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            onClick={() => {
                              if (plan.name === 'Enterprise') {
                                window.location.href = '/contact';
                              } else {
                                window.location.href = '/#pricing';
                              }
                            }}
                          >
                            {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                  Quick view of your current usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Daily Emails</span>
                    <span className="font-medium">0 / Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Emails</span>
                    <span className="font-medium">0 / 100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Devices</span>
                    <span className="font-medium">1 / 1</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-800">
                      View detailed analytics →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
