import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { authConfig } from '@/app/(auth)/auth.config';

import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip auth check for Stripe webhook
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next();
  }
  
  if (request.nextUrl.pathname === '/forgot-password' || request.nextUrl.pathname === '/reset-password' ) {
    return NextResponse.next();
  }

  // Allow any url that starts with /api/auth
  if (request.nextUrl.pathname.match(/^\/api\/auth\/?.*$/)) {    
    return NextResponse.next();
  }

  const session = await auth();

  // Check if the route is protected (chat or sca-generator)
  if (request.nextUrl.pathname.startsWith('/chat') || request.nextUrl.pathname.startsWith('/sca-generator')  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Check subscription status
    if (session.user.subscriptionStatus !== 'active') {
      console.log('here');
      
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }  

  // Check if the authorized callback exists and use it
  if (typeof authConfig.callbacks?.authorized === 'function') {
    const authResult = await authConfig.callbacks.authorized({
      auth: session,
      request
    });

    // Only redirect to /login if not authorized and not already on auth pages
    if (authResult !== true) {
      const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/register');
      if (!isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Allow the response if it's a redirect
    if (authResult instanceof Response) {
      return authResult;
    }
  } else {
    // Default behavior if no authorized callback
    if (!session && 
        !request.nextUrl.pathname.startsWith('/login') && 
        !request.nextUrl.pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow the request to continue if authorized
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