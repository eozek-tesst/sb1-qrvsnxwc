import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getProductByPriceId } from '../stripe-config';

interface Subscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = () => {
    if (!subscription?.price_id) return null;
    const product = getProductByPriceId(subscription.price_id);
    return product?.name || null;
  };

  const isActive = () => {
    return subscription?.subscription_status === 'active';
  };

  const isPending = () => {
    return subscription?.subscription_status === 'incomplete' || 
           subscription?.subscription_status === 'not_started';
  };

  const isCanceled = () => {
    return subscription?.subscription_status === 'canceled';
  };

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    getProductName,
    isActive,
    isPending,
    isCanceled,
  };
}