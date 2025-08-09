import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  const { data, type } = stripeEvent;

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(data);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(data);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(data);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(data);
        break;
      
      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function handleCheckoutCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);
  
  const customerId = session.customer;
  
  if (session.mode === 'subscription') {
    // Para assinaturas, sincronizar dados da subscription
    await syncCustomerSubscription(customerId);
  } else if (session.mode === 'payment') {
    // Para pagamentos únicos, registrar a ordem
    await createStripeOrder(session);
  }
}

async function handleSubscriptionChange(subscription) {
  console.log('Processing subscription change:', subscription.id);
  await syncCustomerSubscription(subscription.customer);
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const customerId = subscription.customer;
  
  try {
    // Atualizar status da subscription para cancelada
    const { error: updateError } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      throw updateError;
    }

    console.log(`Successfully marked subscription as canceled for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    // Atualizar subscription para ativa
    await syncCustomerSubscription(invoice.customer);
  }
}

async function handlePaymentFailed(invoice) {
  console.log('Processing payment failed:', invoice.id);
  
  if (invoice.subscription) {
    // Atualizar status da subscription
    await syncCustomerSubscription(invoice.customer);
  }
}

async function syncCustomerSubscription(customerId) {
  try {
    // Buscar dados mais recentes da subscription no Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // Verificar se o customer existe no nosso banco
    const { data: existingCustomer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw customerError;
    }

    if (!existingCustomer) {
      console.log(`Customer ${customerId} not found in database, skipping sync`);
      return;
    }

    if (subscriptions.data.length === 0) {
      // Sem subscriptions ativas
      const { error: noSubError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: customerId,
          status: 'not_started',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id',
        });

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw noSubError;
      }
      return;
    }

    const subscription = subscriptions.data[0];
    
    // Preparar dados da subscription
    const subscriptionData = {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
      updated_at: new Date().toISOString(),
    };

    // Adicionar dados do método de pagamento se disponível
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      subscriptionData.payment_method_brand = subscription.default_payment_method.card?.brand || null;
      subscriptionData.payment_method_last4 = subscription.default_payment_method.card?.last4 || null;
    }

    // Atualizar subscription no banco
    const { error: subError } = await supabase
      .from('stripe_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'customer_id',
      });

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw subError;
    }

    console.log(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

async function createStripeOrder(session) {
  try {
    const orderData = {
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent,
      customer_id: session.customer,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'completed',
    };

    const { error: orderError } = await supabase
      .from('stripe_orders')
      .insert(orderData);

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    console.log(`Successfully created order for session: ${session.id}`);
  } catch (error) {
    console.error('Error creating stripe order:', error);
    throw error;
  }
}