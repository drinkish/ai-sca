// app/api/stripe/webhook/route.ts
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { user, subscription, type NewSubscription } from "@/db/schema";

import { validate as isUUID } from 'uuid';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get("Stripe-Signature");

    if (!signature) {
      console.error("⚠️ No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`✅ Processing webhook event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout session:', checkoutSession.id);

      const metadata = checkoutSession.metadata as { userId?: string };
      
      if (!metadata?.userId || !isUUID(metadata.userId)) {
        throw new Error('Invalid or missing userId in session metadata');
      }

      // Get the subscription details
      const stripeSubscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription as string
      );

      // Begin transaction to update both tables
      await db.transaction(async (tx) => {
        // 1. Update user table
        await tx
          .update(user)
          .set({
            stripeCustomerId: checkoutSession.customer as string,
            subscriptionStatus: stripeSubscription.status,
            subscriptionEndDate: new Date(stripeSubscription.current_period_end * 1000)
          })
          .where(sql`${user.id} = ${metadata.userId}::uuid`);

        // 2. Insert into subscription table using raw SQL for the userId
        await tx
          .insert(subscription)
          .values({
            stripeSubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status,
            priceId: process.env.STRIPE_PRICE_ID!,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            userId: sql`${metadata.userId}::uuid`
          } as unknown as NewSubscription);
      });

      // Verify the update
      const updatedUser = await db
        .select()
        .from(user)
        .where(sql`${user.id} = ${metadata.userId}::uuid`);

      console.log('Verified user data after update:', {
        id: updatedUser[0].id,
        subscriptionStatus: updatedUser[0].subscriptionStatus,
        stripeCustomerId: updatedUser[0].stripeCustomerId
      });
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