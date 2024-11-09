import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';

import { db } from '@/db';
import { subscription, user } from '@/db/schema';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` }, 
      { status: 400 }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Invoice;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = session as Stripe.Checkout.Session;
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription as string;
          await saveSubscription(
            subscriptionId,
            checkoutSession.customer as string,
            true
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = session as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        await saveSubscription(
          subscriptionId,
          invoice.customer as string,
          false
        );
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  try {
    // Find user by Stripe customer ID
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.stripeCustomerId, customerId));

    if (!dbUser) {
      throw new Error(`User not found with Stripe Customer ID: ${customerId}`);
    }

    // Get subscription details from Stripe
    const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);

    // Prepare subscription data
    const subscriptionInfo = {
      userId: dbUser.id,
      stripeSubscriptionId: subscriptionId,
      status: subscriptionData.status,
      priceId: subscriptionData.items.data[0].price.id,
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
    };

    // Begin transaction
    await db.transaction(async (tx) => {
      if (createAction) {
        // Insert new subscription
        await tx
          .insert(subscription)
          .values(subscriptionInfo);
      } else {
        // Update existing subscription
        await tx
          .update(subscription)
          .set(subscriptionInfo)
          .where(eq(subscription.stripeSubscriptionId, subscriptionId));
      }

      // No need to update user table as we're using the subscription table for status
    });

  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}