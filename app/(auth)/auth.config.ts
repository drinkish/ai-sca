import { NextAuthConfig } from "next-auth";

import type { NextRequest } from 'next/server';

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }: { auth: any; request: NextRequest }) {
      let isLoggedIn = !!auth?.user;
      let isOnChat = request.nextUrl.pathname.startsWith("/");
      let isOnRegister = request.nextUrl.pathname.startsWith("/register");
      let isOnLogin = request.nextUrl.pathname.startsWith("/login");

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      if (isOnRegister || isOnLogin) {
        return true;
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isLoggedIn) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;