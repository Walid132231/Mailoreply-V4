import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export { stripePromise };

// Stripe product and price configurations
export const STRIPE_CONFIG = {
  products: {
    FREE: 'prod_free',
    PRO: 'prod_pro', 
    PRO_PLUS: 'prod_pro_plus',
    ENTERPRISE: 'prod_enterprise'
  },
  prices: {
    // Pro Plan
    PRO_MONTHLY: 'price_pro_monthly',
    PRO_YEARLY: 'price_pro_yearly', 
    
    // Pro Plus Plan
    PRO_PLUS_MONTHLY: 'price_pro_plus_monthly',
    PRO_PLUS_YEARLY: 'price_pro_plus_yearly',
    
    // Enterprise (custom)
    ENTERPRISE_CUSTOM: 'price_enterprise_custom'
  }
};

// Price mapping for display
export const PRICE_DISPLAY = {
  [STRIPE_CONFIG.prices.PRO_MONTHLY]: {
    amount: 599,
    currency: 'usd',
    interval: 'month',
    displayAmount: '$5.99',
    plan: 'pro'
  },
  [STRIPE_CONFIG.prices.PRO_YEARLY]: {
    amount: 4990,
    currency: 'usd', 
    interval: 'year',
    displayAmount: '$4.99',
    plan: 'pro',
    discount: 17,
    savings: '$12'
  },
  [STRIPE_CONFIG.prices.PRO_PLUS_MONTHLY]: {
    amount: 2000,
    currency: 'usd',
    interval: 'month',
    displayAmount: '$20.00',
    plan: 'pro_plus'
  },
  [STRIPE_CONFIG.prices.PRO_PLUS_YEARLY]: {
    amount: 20000,
    currency: 'usd',
    interval: 'year', 
    displayAmount: '$16.67',
    plan: 'pro_plus',
    discount: 17,
    savings: '$40'
  }
};

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    dailyLimit: 3,
    monthlyLimit: 30,
    deviceLimit: 1,
    features: ['Basic templates', 'Email support']
  },
  pro: {
    dailyLimit: -1, // unlimited
    monthlyLimit: 100,
    deviceLimit: 1,
    features: ['Unlimited daily emails', 'Premium templates', 'Priority support']
  },
  pro_plus: {
    dailyLimit: -1,
    monthlyLimit: -1,
    deviceLimit: 2,
    features: ['Unlimited everything', 'Advanced templates', 'Analytics dashboard', '2 device access']
  },
  enterprise: {
    dailyLimit: -1,
    monthlyLimit: -1,
    deviceLimit: -1,
    features: ['Unlimited everything', 'Team management', 'Custom templates', 'Dedicated support']
  }
};

export type PlanType = keyof typeof PLAN_LIMITS;
export type SubscriptionStatus = 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface UserSubscription {
  id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  plan_name: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}
