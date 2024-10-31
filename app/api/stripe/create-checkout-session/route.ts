import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user already has an active subscription
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!users.length) {
      return new NextResponse("User not found", { status: 404 });
    }

    const currentUser = users[0];
    
    if (currentUser.subscriptionStatus === "active") {
      return new NextResponse("Already subscribed", { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: currentUser.stripeCustomerId || undefined,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}