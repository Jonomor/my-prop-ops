import React, { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const EmbeddedCheckoutForm = ({ planId, billingPeriod, returnUrl, onError }) => {
  const { api } = useAuth();
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const fullPlanId = `${planId}_${billingPeriod}`;
        
        const res = await api.post('/billing/create-embedded-checkout', {
          plan_id: fullPlanId,
          return_url: returnUrl
        });
        
        const { client_secret, publishable_key } = res.data;
        
        // Load Stripe with the publishable key
        const stripe = await loadStripe(publishable_key);
        setStripePromise(stripe);
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
        onError?.(error.response?.data?.detail || 'Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [planId, billingPeriod, returnUrl, api, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="checkout-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Initializing checkout...</span>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load checkout. Please try again.
      </div>
    );
  }

  return (
    <div id="checkout" data-testid="embedded-checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default EmbeddedCheckoutForm;
