import { NextResponse } from 'next/server';

import { stripe } from "@/lib/stripe";

export async function POST(req: Request, res: Response) {
  try {
    const { customerId } = await req.json();

    console.log(`customer id: ${customerId}`);

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('portal session');
    console.log(portalSession);

    return NextResponse.redirect(new URL(portalSession.url, req.url));
  } catch (error: any) {
    console.error("Failed to create portal session", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  


  


//   res.redirect(303, portalSession.url);
  
}
