import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DOMAIN = process.env.VITE_APP_URL || 'http://localhost:5173';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/stripe-api', '');
    const method = event.httpMethod;

    if (method === 'POST' && path === '/create-checkout-session') {
      return await createCheckoutSession(event);
    }
    
    if (method === 'POST' && path === '/create-portal-session') {
      return await createPortalSession(event);
    }
    
    if (method === 'POST' && path === '/webhook') {
      return await handleWebhook(event);
    }
    
    if (method === 'POST' && path === '/cancel-subscription') {
      return await cancelSubscription(event);
    }
    
    if (method === 'POST' && path === '/reactivate-subscription') {
      return await reactivateSubscription(event);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Stripe API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

async function createCheckoutSession(event: any) {
  try {
    const { priceId, isYearly, userId, userEmail } = JSON.parse(event.body);

    if (!priceId || !userId || !userEmail) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Get or create Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${DOMAIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/#pricing`,
      metadata: {
        userId,
        priceId,
        isYearly: isYearly.toString(),
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ sessionUrl: session.url }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

async function createPortalSession(event: any) {
  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing userId' }),
      };
    }

    // Get user subscription to find customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No subscription found' }),
      };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${DOMAIN}/dashboard`,
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ sessionUrl: session.url }),
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

async function cancelSubscription(event: any) {
  try {
    const { userId } = JSON.parse(event.body);

    // Get user subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No subscription found' }),
      };
    }

    // Cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update database
    await supabase
      .from('user_subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

async function reactivateSubscription(event: any) {
  try {
    const { userId } = JSON.parse(event.body);

    // Get user subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No subscription found' }),
      };
    }

    // Reactivate subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false }
    );

    // Update database
    await supabase
      .from('user_subscriptions')
      .update({ 
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to reactivate subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

async function handleWebhook(event: any) {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing signature or webhook secret' }),
    };
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Webhook verification failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Get price and product info
    const priceId = subscription.items.data[0]?.price.id;
    const productId = subscription.items.data[0]?.price.product as string;

    // Upsert subscription record
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        price_id: priceId,
        product_id: productId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    // Update user role based on subscription
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      let userRole = 'free'; // default
      
      // Map price IDs to user roles
      const priceToRoleMap = {
        'price_pro_monthly': 'pro',
        'price_pro_yearly': 'pro', 
        'price_pro_plus_monthly': 'pro_plus',
        'price_pro_plus_yearly': 'pro_plus'
      };
      
      userRole = priceToRoleMap[priceId] || 'free';
      
      await supabase
        .from('users')
        .update({ role: userRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
        
      console.log(`Updated user ${userId} role to ${userRole} for subscription ${subscription.id}`);
    }

    console.log(`Subscription ${subscription.status} for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Update subscription status
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`Subscription deleted for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    // Record payment
    await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscription?.id,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: invoice.description || `Payment for ${invoice.lines.data[0]?.description}`,
        receipt_url: invoice.hosted_invoice_url
      });

    console.log(`Payment succeeded for user ${userId}, amount: ${invoice.amount_paid}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    // Record failed payment
    await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscription?.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        description: `Failed payment for ${invoice.lines.data[0]?.description}`
      });

    console.log(`Payment failed for user ${userId}, amount: ${invoice.amount_due}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
