// app/api/stripe/create-checkout-session/route.ts
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/app/(auth)/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    // Verify environment variables
    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error("Missing STRIPE_PRICE_ID");
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    // Get user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user from database
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!users.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const currentUser = users[0];

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: currentUser.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true
      }
    });

    if (!checkoutSession?.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}