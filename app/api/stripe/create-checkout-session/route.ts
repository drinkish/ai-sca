import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { stripe } from "@/lib/stripe";

if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID is not set');
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  
  export async function POST() {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
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
  
      // Create Stripe checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        customer: currentUser.stripeCustomerId || undefined,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        metadata: {
          userId: session.user.id,
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        customer_email: session.user.email || undefined,
      });
  
      if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session URL");
      }
  
      return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }
  }