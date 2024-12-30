import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/index";
import { subscription } from "@/db/schema";

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);
    
    return NextResponse.json(userSubscription || null);
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
