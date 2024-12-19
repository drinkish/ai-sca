'use client';

import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";

export default function SubscriptionClient() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle redirect status and session refresh
  useEffect(() => {
    const handleSubscriptionSuccess = async () => {
      if (searchParams.get('success')) {
        try {
          // Force an immediate session refresh
          await update();
          // Wait a brief moment to ensure the session is updated
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Session updated:', session);
          // Redirect to start page after successful subscription
          router.replace('/start');
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      }
    };

    handleSubscriptionSuccess();
  }, [searchParams, update, router, session]);

  // Handle subscription cancellation
  useEffect(() => {
    if (searchParams.get('canceled')) {
      setError('Payment canceled. Please try again.');
      router.replace('/subscription');
    }
  }, [searchParams, router]);

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

  // Debug logging
  useEffect(() => {
    console.log(session?.user);
    
    console.log('Current session status:', {
      isAuthenticated: !!session,
      subscriptionStatus: session?.user?.subscriptionStatus,
      loading: status === 'loading'
    });
  }, [session, status]);

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
              <ul className="text-left space-y-2 pl-4">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  AI Tutor enhanced capabilities
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited SCA generated explanations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>
            {/* Optional: Add subscription management button */}
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
              <ul className="text-left space-y-2 mb-6 pl-4">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  AI Tutor enhanced capabilities
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited SCA generated explanations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
              
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