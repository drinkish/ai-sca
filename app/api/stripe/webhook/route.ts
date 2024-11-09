// app/api/stripe/webhook/route.ts
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { validate as isUUID } from 'uuid';

import { db } from "@/db";
import { user, subscription } from "@/db/schema";

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

      console.log('Retrieved subscription:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        customerId: checkoutSession.customer
      });

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

        console.log('Updated user subscription status');

        // 2. Insert into subscription table using raw SQL for UUID handling
        await tx.execute(
          sql`
            INSERT INTO "Subscription" (
              "userId",
              "stripeSubscriptionId",
              "status",
              "priceId",
              "currentPeriodStart",
              "currentPeriodEnd"
            ) VALUES (
              ${metadata.userId}::uuid,
              ${stripeSubscription.id},
              ${stripeSubscription.status},
              ${process.env.STRIPE_PRICE_ID},
              ${new Date(stripeSubscription.current_period_start * 1000)},
              ${new Date(stripeSubscription.current_period_end * 1000)}
            )
          `
        );

        console.log('Created subscription record');
      });

      // Verify the updates
      const [updatedUser] = await db
        .select()
        .from(user)
        .where(sql`${user.id} = ${metadata.userId}::uuid`);

      console.log('Verified user data after update:', {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        stripeCustomerId: updatedUser.stripeCustomerId
      });

      const [subscriptionRecord] = await db
        .select()
        .from(subscription)
        .where(sql`${subscription.userId} = ${metadata.userId}::uuid`);

      console.log('Verified subscription record:', {
        id: subscriptionRecord.id,
        status: subscriptionRecord.status,
        stripeSubscriptionId: subscriptionRecord.stripeSubscriptionId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}