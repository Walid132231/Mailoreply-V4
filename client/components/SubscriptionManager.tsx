import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Settings
} from 'lucide-react';
import { StripeAPI } from '@/lib/stripe-api';
import { UserSubscription, PLAN_LIMITS } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subData, paymentData] = await Promise.all([
        StripeAPI.getUserSubscription(),
        StripeAPI.getPaymentHistory()
      ]);
      
      setSubscription(subData);
      setPaymentHistory(paymentData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading('portal');
      const portalUrl = await StripeAPI.createPortalSession();
      window.open(portalUrl, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading('cancel');
      await StripeAPI.cancelSubscription();
      await loadSubscriptionData();
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription will remain active until the end of your billing period.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading('reactivate');
      await StripeAPI.reactivateSubscription();
      await loadSubscriptionData();
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800', label: 'Trial' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', label: 'Past Due' },
      canceled: { color: 'bg-gray-100 text-gray-800', label: 'Canceled' },
      unpaid: { color: 'bg-red-100 text-red-800', label: 'Unpaid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCurrentPlan = () => {
    if (!subscription) return 'free';
    if (subscription.plan_name.toLowerCase().includes('pro plus')) return 'pro_plus';
    if (subscription.plan_name.toLowerCase().includes('pro')) return 'pro';
    if (subscription.plan_name.toLowerCase().includes('enterprise')) return 'enterprise';
    return 'free';
  };

  const getPlanFeatures = () => {
    const plan = getCurrentPlan();
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Subscription</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{subscription.plan_name}</h3>
                  <p className="text-sm text-gray-600">
                    Active until {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              {subscription.cancel_at_period_end && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription is set to cancel at the end of the billing period. 
                    You can reactivate it anytime before then.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Plan Features */}
              <div>
                <h4 className="font-medium mb-2">Current Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {getPlanFeatures().features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleManageBilling}
                  disabled={actionLoading !== null}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>
                    {actionLoading === 'portal' ? 'Loading...' : 'Manage Billing'}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>

                {subscription.cancel_at_period_end ? (
                  <Button 
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading !== null}
                    variant="outline"
                  >
                    {actionLoading === 'reactivate' ? 'Loading...' : 'Reactivate Subscription'}
                  </Button>
                ) : subscription.status === 'active' && (
                  <Button 
                    onClick={handleCancelSubscription}
                    disabled={actionLoading !== null}
                    variant="destructive"
                  >
                    {actionLoading === 'cancel' ? 'Loading...' : 'Cancel Subscription'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
              <p className="text-gray-600 mb-4">
                You're currently on the free plan with limited features.
              </p>
              <Button onClick={() => window.location.href = '/#pricing'}>
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payment History</span>
            </CardTitle>
            <CardDescription>
              Your recent billing history and receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{formatAmount(payment.amount, payment.currency)}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      payment.status === 'succeeded' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }>
                      {payment.status}
                    </Badge>
                    {payment.receipt_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(payment.receipt_url, '_blank')}
                      >
                        Receipt
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
