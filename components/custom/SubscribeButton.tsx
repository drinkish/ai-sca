"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscribeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Make request to our API to create Stripe checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start checkout process");
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error("No checkout URL received");
      }

      // Redirect to Stripe's hosted checkout page
      window.location.assign(url);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Failed to start checkout process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        variant="default"
        size="lg"
        className="px-8"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          "Subscribe Now"
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}