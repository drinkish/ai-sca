import { compare } from "bcrypt-ts";
import NextAuth, { DefaultSession, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser } from "@/db/queries";

import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      stripeCustomerId?: string | null;
      subscriptionStatus: string;
      subscriptionEndDate?: Date | null;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Partial<Record<"email" | "password", unknown>>, request: Request): Promise<User | null> {
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
          return userWithoutPassword;
        }
      
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId ?? null;
        token.subscriptionStatus = user.subscriptionStatus ?? 'inactive';
        token.subscriptionEndDate = user.subscriptionEndDate ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.stripeCustomerId = token.stripeCustomerId as string | null;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.subscriptionEndDate = token.subscriptionEndDate as Date | null;
      }
      return session;
    },
  },
});