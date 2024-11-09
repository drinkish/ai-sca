'use client';

import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";

export default function SubscriptionClient() {
  const { data: session, status, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle redirect status and session refresh
  useEffect(() => {
    if (searchParams.get('success')) {
      // Refresh the session to get updated subscription status
      updateSession();
      // Optionally remove the query params
      router.replace('/subscription');
    }
    if (searchParams.get('canceled')) {
      setError('Payment canceled. Please try again.');
    }
  }, [searchParams, updateSession, router]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start checkout process");
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error("No checkout URL received");
      }

      window.location.assign(url);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : "Failed to start checkout process");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[200px] pt-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Check if user has active subscription
  const isSubscribed = session?.user?.subscriptionStatus === 'active';

  return (
    <div className="max-w-2xl mx-auto p-6 mt-16 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Subscription</h1>
        
        {isSubscribed ? (
          <div className="p-8 bg-white rounded-lg shadow-sm border space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              <p className="font-medium">You have an active subscription!</p>
            </div>
            <div className="text-gray-600">
              <h2 className="text-xl font-semibold mb-4">Premium Features Unlocked</h2>
              <ul className="text-left space-y-2">
                <li>✓ Access to all premium features</li>
                <li>✓ Advanced capabilities</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
            {/* You could add subscription management options here */}
            {/* <Button
              onClick={() => router.push('/account/billing')}
              variant="outline"
              className="mt-4"
            >
              Manage Subscription
            </Button> */}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Premium Features</h2>
              <p className="text-gray-600 mb-6">
                Subscribe to access premium features and unlock the full potential.
              </p>
              
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                variant="default"
                size="lg"
                className="w-full bg-black hover:bg-gray-800"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
              
              {error && (
                <p className="mt-4 text-sm text-red-500 text-center">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}