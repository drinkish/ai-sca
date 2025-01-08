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

  // Premium routes that require subscription
  const premiumRoutes = ['/chat', '/sca-generator', '/dashboard'];
  const isPremiumRoute = premiumRoutes.some(route => pathname.startsWith(route));

  if (isPremiumRoute) {
    // Check subscription status
    if (!session.user?.subscriptionStatus || session.user.subscriptionStatus !== 'active') {
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
};