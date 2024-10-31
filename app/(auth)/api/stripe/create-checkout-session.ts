import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/db'; // Updated import
import { user } from '@/db/schema';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { priceId } = await req.json();

    const dbUser = await db.select().from(user).where(eq(user.id, session.user.id)).execute();

    if (!dbUser[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeCustomerId = dbUser[0].stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: dbUser[0].email,
      });
      stripeCustomerId = customer.id;
      await db.update(user).set({ stripeCustomerId }).where(eq(user.id, dbUser[0].id)).execute();
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/subscription?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}