import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import EmbeddedCheckoutForm from '../components/EmbeddedCheckout';
import { 
  CreditCard, 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  ArrowRight,
  Loader2,
  CheckCircle,
  Sparkles,
  X,
  Building
} from 'lucide-react';

const Billing = () => {
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('annual');
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Check for payment success from embedded checkout return
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/billing/subscription-status'),
        api.get('/billing/plans')
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    setCheckingPayment(true);
    
    // Poll for payment status
    const maxAttempts = 10;
    let attempts = 0;
    
    const poll = async () => {
      try {
        const res = await api.get(`/billing/session-status/${sessionId}`);
        
        if (res.data.payment_status === 'paid') {
          toast.success('Successfully upgraded your plan!');
          await fetchData(); // Refresh subscription data
          navigate('/billing', { replace: true });
          setCheckingPayment(false);
          return;
        } else if (res.data.status === 'expired') {
          toast.error('Payment session expired. Please try again.');
          navigate('/billing', { replace: true });
          setCheckingPayment(false);
          return;
        } else if (res.data.status === 'complete') {
          // Session complete but payment might be processing
          toast.success('Payment successful!');
          await fetchData();
          navigate('/billing', { replace: true });
          setCheckingPayment(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          toast.info('Payment is still processing. Please refresh the page.');
          navigate('/billing', { replace: true });
          setCheckingPayment(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Try to get status from checkout-status endpoint as fallback
        try {
          const fallbackRes = await api.get(`/billing/checkout-status/${sessionId}`);
          if (fallbackRes.data.payment_status === 'paid') {
            toast.success(`Successfully upgraded your plan!`);
            await fetchData();
            navigate('/billing', { replace: true });
            setCheckingPayment(false);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback check also failed:', fallbackError);
        }
        toast.error('Failed to verify payment status');
        navigate('/billing', { replace: true });
        setCheckingPayment(false);
      }
    };
    
    poll();
  };

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    setCheckoutOpen(true);
  };

  const handleCheckoutError = (error) => {
    toast.error(error);
    setCheckoutOpen(false);
  };

  const getPrice = (plan) => {
    if (!plan.pricing) return 0;
    return billingPeriod === 'annual' ? plan.pricing.annual : plan.pricing.monthly;
  };

  const isCurrentPlan = (planId) => {
    return subscription?.plan === planId;
  };

  const canUpgrade = (planId) => {
    const hierarchy = { free: 0, standard: 1, pro: 2, enterprise: 3 };
    return hierarchy[planId] > hierarchy[subscription?.plan || 'free'];
  };

  const canDowngrade = (planId) => {
    const hierarchy = { free: 0, standard: 1, pro: 2, enterprise: 3 };
    return hierarchy[planId] < hierarchy[subscription?.plan || 'free'];
  };

  if (loading || checkingPayment) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]" data-testid="billing-loading">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {checkingPayment ? 'Verifying payment...' : 'Loading billing information...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8" data-testid="billing-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and upgrade your plan
          </p>
        </div>

        {/* Current Plan & Usage */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold capitalize">{subscription?.plan || 'Free'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === 'active' ? 'Active subscription' : 'Free tier'}
                  </p>
                </div>
                <Badge variant={subscription?.plan === 'pro' ? 'default' : 'secondary'}>
                  {subscription?.plan === 'pro' ? 'Premium' : subscription?.plan === 'standard' ? 'Standard' : 'Free'}
                </Badge>
              </div>
              
              {subscription?.billing_period && (
                <p className="text-sm text-muted-foreground">
                  Billed {subscription.billing_period}
                  {subscription.next_billing_date && (
                    <> · Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}</>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Properties</span>
                  <span>{subscription?.usage?.properties || 0} / {subscription?.limits?.max_properties || '∞'}</span>
                </div>
                <Progress 
                  value={subscription?.limits?.max_properties 
                    ? (subscription.usage.properties / subscription.limits.max_properties) * 100 
                    : 0
                  } 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Units</span>
                  <span>{subscription?.usage?.units || 0} / {subscription?.limits?.max_units || '∞'}</span>
                </div>
                <Progress 
                  value={subscription?.limits?.max_units 
                    ? (subscription.usage.units / subscription.limits.max_units) * 100 
                    : 0
                  } 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Team Members</span>
                  <span>{subscription?.usage?.team_members || 0} / {subscription?.limits?.max_team_members || '∞'}</span>
                </div>
                <Progress 
                  value={subscription?.limits?.max_team_members 
                    ? (subscription.usage.team_members / subscription.limits.max_team_members) * 100 
                    : 0
                  } 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="billing-period-monthly"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === 'annual' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="billing-period-annual"
            >
              Annual
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.id === 'enterprise' && <Building className="w-5 h-5 text-purple-500" />}
                  {plan.id === 'pro' && <Crown className="w-5 h-5 text-yellow-500" />}
                  {plan.id === 'standard' && <Zap className="w-5 h-5 text-blue-500" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold">${getPrice(plan)}</span>
                  <span className="text-muted-foreground">/month</span>
                  {billingPeriod === 'annual' && plan.annual_savings && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${plan.annual_savings}/year
                    </p>
                  )}
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {isCurrentPlan(plan.id) ? (
                  <Button className="w-full" variant="outline" disabled data-testid={`current-plan-${plan.id}`}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : canUpgrade(plan.id) ? (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    data-testid={`upgrade-btn-${plan.id}`}
                  >
                    Upgrade
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Free Forever
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Contact Support to Change
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ/Info */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Secure payment processing via Stripe</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Cancel anytime - no long-term contracts</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Upgrade instantly - get immediate access to new features</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Annual plans are billed once per year at the discounted rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Your Upgrade
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <EmbeddedCheckoutForm 
              planId={selectedPlan}
              billingPeriod={billingPeriod}
              returnUrl={`${window.location.origin}/billing`}
              onError={handleCheckoutError}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Billing;
