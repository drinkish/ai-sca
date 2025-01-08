// app/api/stripe/webhook/route.ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { validate as isUUID } from 'uuid';

import { db } from "@/db";
import { updateUserStripeId, upsertSubscription } from "@/db/queries";
import { user, subscription } from "@/db/schema";
import { sendMail } from "@/lib/send-mail";

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

      const userId = metadata.userId;

      // Get the subscription details
      const stripeSubscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription as string
      );

      console.log('Retrieved subscription:', {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        customerId: checkoutSession.customer
      });

      // Begin transaction to update both user and subscription
      try {
        await db.transaction(async (tx) => {
          // 1. Update user's Stripe customer ID
          await tx
            .update(user)
            .set({ stripeCustomerId: checkoutSession.customer as string })
            .where(eq(user.id, userId));

          console.log('Updated user stripe customer ID');

          // 2. Create or update subscription with active status
          await tx
            .insert(subscription)
            .values({
              userId,
              stripeSubscriptionId: stripeSubscription.id,
              status: 'active', // Explicitly set to active
              priceId: process.env.STRIPE_PRICE_ID!,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            })
            .onConflictDoUpdate({
              target: [subscription.userId],
              set: {
                stripeSubscriptionId: stripeSubscription.id,
                status: 'active', // Explicitly set to active
                priceId: process.env.STRIPE_PRICE_ID!,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
              }
            });

          console.log('Upserted subscription record');
        });

        // Verify the updates
        const [updatedUser] = await db
          .select()
          .from(user)
          .where(eq(user.id, userId));

        console.log('Verified user data after update:', {
          id: updatedUser.id,
          stripeCustomerId: updatedUser.stripeCustomerId
        });

        const [subscriptionRecord] = await db
          .select()
          .from(subscription)
          .where(eq(subscription.userId, userId));

        console.log('Verified subscription record:', {
          id: subscriptionRecord.id,
          status: subscriptionRecord.status,
          stripeSubscriptionId: subscriptionRecord.stripeSubscriptionId
        });

      } catch (error) {
        console.error('Error in database transaction:', error);
        throw error;
      }
    }

    // adding email functionality

    
    // const mailOptions = {
    //     email: process.env.SMTP_EMAIL as string,
    //     sendTo: "musafdev@gmail.com",
    //     subject: 'Subscription Activated',
    //     text: `Congrates your subscription is activated`,
    //     html: `<p>You are subscribed to our services</p>`,
    //   };
    
    //   try {
    //     await sendMail( mailOptions);   
    
    //     // console.log("Password reset link sent to", email);
    
    //     return NextResponse.json({ message: "Password reset link sent to your email." });
        
    
    //   } catch (error) {
    //     console.error("Error sending email:", error);
    //     return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    //   }

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