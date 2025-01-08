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

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
} satisfies NextAuthConfig;