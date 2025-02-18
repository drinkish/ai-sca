import { NextResponse } from "next/server";

import { getSubscription } from "@/db/queries";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const subscriptionData = await getSubscription(userId);
    return NextResponse.json({
      status: subscriptionData?.status ?? 'inactive',
      currentPeriodEnd: subscriptionData?.currentPeriodEnd ?? null
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
} 