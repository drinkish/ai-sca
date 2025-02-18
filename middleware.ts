import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';

import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {

  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and webhooks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/api/stripe/webhook'
  ) {
    return NextResponse.next();
  }

  // Public routes - allow access
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Get session for all protected routes
  const session = await auth();
  
  // Not logged in - redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

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
  // if (typeof authConfig.callbacks?.authorized === 'function') {
  //   const authResult = await authConfig.callbacks.authorized({
  //     auth: session,
  //     request
  //   });

  //   // Only redirect to /login if not authorized and not already on auth pages
  //   if (authResult !== true) {
  //     const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
  //     request.nextUrl.pathname.startsWith('/register');
  //     if (!isAuthPage) {
  //       return NextResponse.redirect(new URL('/login', request.url));
  //     }
  //   }

  //   // Allow the response if it's a redirect
  //   if (authResult instanceof Response) {
  //     return authResult;
  //   }
  // } else {
  //   // Default behavior if no authorized callback
  //   if (!session && 
  //       !request.nextUrl.pathname.startsWith('/login') && 
  //       !request.nextUrl.pathname.startsWith('/register')) {
  //     return NextResponse.redirect(new URL('/login', request.url));
  //   }

  // }

  // Allow the request to continue if authorized
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
};