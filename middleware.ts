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
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next();
  }

  // Get session once for all checks
  const session = await auth();
  
  // Not logged in - redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check subscription for protected routes
  if (
    pathname.startsWith('/chat') ||
    pathname.startsWith('/sca-generator') ||
    pathname.startsWith('/dashboard')
  ) {
    if (session.user.subscriptionStatus !== 'active') {
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }

  return NextResponse.next();
}

// Update matcher to be more specific
export const config = {
  matcher: [
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
};