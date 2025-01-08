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

  // Allow all API routes except those that need auth
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/chat')) {
    return NextResponse.next();
  }

  const session = await auth();

  // If not logged in, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected routes that need subscription
  const protectedRoutes = ['/chat', '/sca-generator', '/dashboard'];
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (session.user.subscriptionStatus !== 'active') {
      return NextResponse.redirect(new URL('/subscription', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};