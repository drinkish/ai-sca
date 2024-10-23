import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Local imports
import { db } from '@/db/queries';
import { subscription, user } from '@/db/schema';
import { stripe } from '@/lib/stripe.js';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed':
      if (session.mode === 'subscription') {
        const subscriptionId = session.subscription;
        await saveSubscription(
          subscriptionId,
          session.customer as string,
          true
        );
      }
      break;

    case 'invoice.payment_succeeded':
      const subscriptionId = session.subscription;
      await saveSubscription(
        subscriptionId,
        session.customer as string,
        false
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  const dbUser = await db.select().from(user).where(eq(user.stripeCustomerId, customerId)).execute();

  if (!dbUser[0]) {
    console.error('User not found with Stripe Customer ID:', customerId);
    return;
  }

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionInfo = {
    userId: dbUser[0].id,
    stripeSubscriptionId: subscriptionId,
    status: subscriptionData.status,
    priceId: subscriptionData.items.data[0].price.id,
    currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
    currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
  };

  if (createAction) {
    await db.insert(subscription).values(subscriptionInfo).execute();
  } else {
    await db.update(subscription)
      .set(subscriptionInfo)
      .where(eq(subscription.stripeSubscriptionId, subscriptionId))
      .execute();
  }

  // Update user's subscription status
  await db.update(user)
    .set({ subscriptionStatus: subscriptionData.status })
    .where(eq(user.id, dbUser[0].id))
    .execute();
}