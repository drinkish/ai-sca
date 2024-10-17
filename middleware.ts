import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';  // Adjust this path if necessary
import { authConfig } from '@/app/(auth)/auth.config';  // Adjust this path if necessary

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Check if the authorized callback exists and use it
  if (typeof authConfig.callbacks?.authorized === 'function') {
    const authResult = await authConfig.callbacks.authorized({
      auth: session,
      request: { nextUrl: request.nextUrl }
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
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};