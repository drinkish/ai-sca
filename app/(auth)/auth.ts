import { compare } from "bcrypt-ts";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser, getSubscription } from "@/db/queries";

import { authConfig } from "./auth.config";

const handler = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Partial<Record<"email" | "password", unknown>>, request: Request) {
        const email = credentials?.email;
        const password = credentials?.password;
        
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }
      
        const users = await getUser(email);
        if (users.length === 0) return null;
        
        const passwordsMatch = await compare(password, users[0].password);
        if (passwordsMatch) {
          const { password: _, ...userWithoutPassword } = users[0];
          
          // Get subscription data
          const subscriptionData = await getSubscription(userWithoutPassword.id);
          
          // Return user with subscription data
          return {
            ...userWithoutPassword,
            subscriptionStatus: subscriptionData?.status ?? 'inactive',
            subscriptionEndDate: subscriptionData?.currentPeriodEnd ?? null
          };
        }
      
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionEndDate = user.subscriptionEndDate;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.stripeCustomerId = token.stripeCustomerId as string | null;
        session.user.subscriptionStatus = (token.subscriptionStatus as string) ?? 'inactive';
        session.user.subscriptionEndDate = token.subscriptionEndDate as Date | null;
      }
      return session;
    },
  },
});

export const { auth, handlers, signIn, signOut } = handler;