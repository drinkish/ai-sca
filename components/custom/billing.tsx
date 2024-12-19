"use client"

import { CreditCard, Package } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSubscription, getUser } from '@/db/queries'
import { stripe } from '@/lib/stripe';


interface SubscriptionType {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}


export default function BillingDetails() {
  
  const [autoRenew, setAutoRenew] = useState(true)
  const [subscription, setSubscription] = useState <SubscriptionType | null>(null);
  const [user, setUser] = useState <any | null>(null);
  const {data: session} = useSession();

  useEffect(() => {
    const getUserId = async () => {
      const [userData] = await getUser(session?.user?.email!);
      const subscriptionData = await getSubscription(userData.id);
      setSubscription(subscriptionData);
      console.log('subscription');
      console.log(subscription);

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionData?.stripeSubscriptionId!);
      console.log('stripeSubscription retrieval');
      console.log(stripeSubscription);
      
      setUser(userData);
      console.log("Set user data");
      console.log(userData);
      
    }
    getUserId();
  }, [session?.user?.email])

  const handleClick = async () => {
    console.log(`Clicked`);
    console.log(subscription);

    try{
        const res = await fetch(`/api/stripe/create-portal-session`, {method: "POST", body: JSON.stringify({customerId: user?.stripeCustomerId})});
        window.location.assign(res.url);
        console.log(res.url);
    }
    catch (error) {
      console.error("Failed to get the stipe portal session", error);
      throw error;
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription plan details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span>{subscription ? subscription?.status : "Unactive"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Plan:</span>
                <span>Subscription</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Billing Cycle:</span>
                <span>Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Next Billing Date:</span>
                <span>{subscription &&  new Date(subscription?.currentPeriodEnd).toLocaleDateString() }</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="font-medium">Amount:</span> </div> */}

            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button id="checkout-and-portal-button" variant="outline" onClick={handleClick}>Cancel Subscription</Button>
            
            {/* <div className="flex items-center space-x-2">
              <Switch
                id="auto-renew"
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
              />
              <Label htmlFor="auto-renew">Auto-renew</Label>
            </div> */}
          </CardFooter>
        </Card>

        
      </div>

      <div className="mt-6">
        
      </div>
    </div>
  )
}


// import { useSession } from "next-auth/react";

// export default function Billing() {
//   const {data: session} = useSession();
//   const handleClick = () => {
//     console.log(`Session data`);
//     console.log(session);
    

//   }

//   return (
//     <div>
//         <button onClick={handleClick}>Manage your billing</button>
//     </div>
//   )
// }
