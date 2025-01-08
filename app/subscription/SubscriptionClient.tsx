'use client';

import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { getSession, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";

export default function SubscriptionClient() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle redirect status and session refresh
  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const checkSubscription = async (retryCount: number = 0): Promise<boolean> => {
      await update();
      const newSession = await getSession();
      return newSession?.user?.subscriptionStatus === 'active';
    };

    const handleSubscriptionSuccess = async () => {
      if (searchParams.get('success')) {
        setIsCheckingSubscription(true);
        try {
          let retryCount = 0;
          let isActive = await checkSubscription();

          while (!isActive && retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            isActive = await checkSubscription(retryCount);
            retryCount++;
          }

          if (isActive) {
            router.push('/start');
          } else {
            setError('Subscription status not updated. Please contact support if this persists.');
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
          setError('Failed to verify subscription. Please try refreshing the page.');
        } finally {
          setIsCheckingSubscription(false);
        }
      }
    };

    handleSubscriptionSuccess();
  }, [searchParams, update, router]);

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
    } catch (error: unknown) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : "Failed to start checkout process");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading states
  if (status === 'loading' || isCheckingSubscription) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px] pt-20 gap-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {isCheckingSubscription ? 'Verifying subscription...' : 'Loading...'}
        </p>
      </div>
    );
  }

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