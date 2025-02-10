import { NextAuthConfig } from "next-auth";

import type { NextRequest } from 'next/server';

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/start",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }: { auth: any; request: NextRequest }) {
      let isLoggedIn = !!auth?.user;
      let isOnAuth = request.nextUrl.pathname.startsWith("/register") || 
                     request.nextUrl.pathname.startsWith("/login");
      
      // If logged in and trying to access auth pages, redirect to /start
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL("/start", request.nextUrl));
      }

      // // If trying to access auth pages, allow access
      // if (isOnAuth) {
      //   return true;
      // }

      // // For all other routes, require authentication
      // if (!isLoggedIn) {
      //   return false;
      // }
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      
      // Public paths that don't require auth checks
      if (path.startsWith('/login') || 
          path.startsWith('/register') || 
          path.startsWith('/subscription')) {
        return true;
      }

      // Protected paths
      if (path.startsWith('/')) {
        return isLoggedIn;
      }


      // Allow logged in users to access all other routes
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
} satisfies NextAuthConfig;