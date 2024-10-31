import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/app/(auth)/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { stripe } from "@/lib/stripe";

function getBaseUrl() {
    // First try environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }
  
    // Fallback to constructing from headers
    const headersList = headers();
    const host = headersList.get("host");
    
    if (!host) {
      throw new Error("No host found in headers and NEXT_PUBLIC_APP_URL not set");
    }
  
    // Check if we're in a Vercel environment
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
  
    // Last resort fallback
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${protocol}://${host}`;
  }
  
  export async function POST() {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
  
      // Get and validate base URL
      let baseUrl: string;
      try {
        baseUrl = getBaseUrl();
        console.log("Using base URL:", baseUrl); // Debug log
      } catch (error) {
        console.error("Error getting base URL:", error);
        return new NextResponse("Server configuration error", { status: 500 });
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
  
      // Log the URLs we're about to use
      console.log("Success URL:", `${baseUrl}/dashboard?success=true`);
      console.log("Cancel URL:", `${baseUrl}/dashboard?canceled=true`);
  
      // Create Stripe checkout session with validated URLs
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
        success_url: `${baseUrl}/dashboard?success=true`,
        cancel_url: `${baseUrl}/dashboard?canceled=true`,
        metadata: {
          userId: session.user.id,
        },
      });
  
      return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return new NextResponse(
        `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        { status: 500 }
      );
    }
  }