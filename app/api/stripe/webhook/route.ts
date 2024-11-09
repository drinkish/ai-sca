// app/api/stripe/webhook/route.ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { user } from "@/db/schema";

// Use the new route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature");

    if (!signature) {
      console.error("No stripe signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    console.log("Received webhook", signature.substring(0, 20) + "...");

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

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Processing checkout session:", session.id);
        
        if (!session?.metadata?.userId) {
          console.error("No userId in session metadata");
          return NextResponse.json(
            { error: "No userId in session metadata" },
            { status: 400 }
          );
        }

        // Get subscription
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        console.log("Updating user subscription status:", {
          userId: session.metadata.userId,
          status: subscription.status,
        });

        // Update user
        await db
          .update(user)
          .set({
            stripeCustomerId: session.customer as string,
            subscriptionStatus: subscription.status,
            subscriptionEndDate: new Date(subscription.current_period_end * 1000)
          })
          .where(eq(user.id, session.metadata.userId));

        console.log("Successfully updated user subscription");
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (!subscription.metadata.userId) {
          console.error("No userId in subscription metadata");
          return NextResponse.json(
            { error: "No userId in subscription metadata" },
            { status: 400 }
          );
        }

        console.log("Updating subscription status:", {
          userId: subscription.metadata.userId,
          status: subscription.status,
        });

        // Update user
        await db
          .update(user)
          .set({
            subscriptionStatus: subscription.status,
            subscriptionEndDate: new Date(subscription.current_period_end * 1000)
          })
          .where(eq(user.id, subscription.metadata.userId));

        console.log("Successfully updated subscription status");
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}