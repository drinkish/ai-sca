import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';

import type { NextRequest } from 'next/server';


export async function middleware(request: NextRequest) {
  // Public paths that don't need auth
  const publicPaths = [
    '/api/stripe/webhook',
    '/forgot-password',
    '/reset-password',
    '/login',
    '/register',
    '/subscription'
  ];

  // Check if the path is public
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next();
  }

  const session = await auth();

  // If not logged in, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // All routes that require subscription
  const subscriptionRoutes = ['/chat', '/sca-generator', '/dashboard'];
  
  // Check if current path requires subscription
  const requiresSubscription = subscriptionRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (requiresSubscription && session.user.subscriptionStatus !== 'active') {
    return NextResponse.redirect(new URL('/subscription', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};