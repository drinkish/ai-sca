// app/api/stripe/webhook/route.ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { user } from "@/db/schema";

// Configure the runtime
export const runtime = 'nodejs';

// Disable body parsing, must be raw for Stripe
export const preferredRegion = 'home';
export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get("Stripe-Signature");

    if (!signature) {
      console.error("⚠️ No Stripe signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    // Verify the event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`✅ Verified webhook: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout session: ${session.id}`);
      
      // Verify we have the required data
      if (!session?.metadata?.userId) {
        throw new Error('No userId in session metadata');
      }

      if (!session.subscription) {
        throw new Error('No subscription in session');
      }

      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Update the user's subscription status
      await db
        .update(user)
        .set({
          stripeCustomerId: session.customer as string,
          subscriptionStatus: subscription.status,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000)
        })
        .where(eq(user.id, session.metadata.userId));

      console.log(`✅ Updated subscription for user: ${session.metadata.userId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}