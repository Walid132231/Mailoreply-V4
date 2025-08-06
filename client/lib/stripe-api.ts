import { supabase } from './supabase';
import { UserSubscription } from './stripe';

export class StripeAPI {
  private static baseUrl = '/api/stripe';

  // Create Stripe checkout session
  static async createCheckoutSession(priceId: string, isYearly: boolean = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          isYearly,
          userId: user.id,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();
      return sessionUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create customer portal session
  static async createPortalSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create portal session');
      }

      const { sessionUrl } = await response.json();
      return sessionUrl;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Get user's current subscription
  static async getUserSubscription(): Promise<UserSubscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .rpc('get_user_subscription', { user_uuid: user.id });

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Cancel subscription at period end
  static async cancelSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  static async reactivateSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseUrl}/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Get pricing information
  static async getPricingData() {
    try {
      const { data: products, error: productsError } = await supabase
        .from('stripe_products')
        .select(`
          *,
          stripe_prices (*)
        `)
        .eq('active', true);

      if (productsError) {
        throw productsError;
      }

      return products;
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      throw error;
    }
  }

  // Get payment history
  static async getPaymentHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
}
