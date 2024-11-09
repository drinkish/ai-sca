import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { authConfig } from '@/app/(auth)/auth.config';

import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip auth check for Stripe webhook
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next();
  }

  const session = await auth();

  // Check if the route is protected (chat or sca-generator)
  if (request.nextUrl.pathname.startsWith('/chat') || request.nextUrl.pathname.startsWith('/sca-generator')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Check subscription status
    if (session.user.subscriptionStatus !== 'active') {
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }  

  // Check if the authorized callback exists and use it
  if (typeof authConfig.callbacks?.authorized === 'function') {
    const authResult = await authConfig.callbacks.authorized({
      auth: session,
      request
    });

    if (authResult === false) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (authResult instanceof Response) {
      return authResult;
    }
  } else {
    // Default behavior if authorized callback is not defined
    if (!session && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Update matcher to be more specific and exclude the webhook path
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/stripe/webhook (webhook endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
};