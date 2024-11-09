// app/api/webhook/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserSubscription } from "@/db/queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve the subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Update user's subscription status in your database
        await updateUserSubscription(
          session.metadata?.userId!,
          session.customer as string,
          subscription.status,
          new Date(subscription.current_period_end * 1000)
        );

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
          await updateUserSubscription(
            userId,
            subscription.customer as string,
            subscription.status,
            new Date(subscription.current_period_end * 1000)
          );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

// Configure the runtime to handle Stripe webhooks properly
export const config = {
  api: {
    bodyParser: false,
  },
};