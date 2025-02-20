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

        
        if(auth.subscriptionStatus !== 'active') {
          return Response.redirect(new URL("/start", request.nextUrl));
        }
      
      }

      // If trying to access auth pages, allow access
      if (isOnAuth) {
        return true;
      }


      // Allow logged in users to access all other routes
      return isLoggedIn;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  }
} satisfies NextAuthConfig;