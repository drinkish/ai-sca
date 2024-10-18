'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SubscriptionClient() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'your_stripe_price_id' }),
      });
      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Subscription</h1>
      {session?.user?.subscriptionStatus === 'active' ? (
        <p>You have an active subscription.</p>
      ) : (
        <>
          <p>Subscribe to access premium features.</p>
          <button onClick={handleSubscribe} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </>
      )}
    </div>
  );
}