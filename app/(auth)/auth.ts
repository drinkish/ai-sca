import { compare } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/db/index";
import { getUser, getSubscription } from "@/db/queries";
import { subscription } from "@/db/schema";

import { registerWithGoogle } from "./actions";
import { authConfig } from "./auth.config";

const handler = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      profile(profile){
        // console.log(profile);

        return {
          ...profile,
          method: "google"
        }
        
      },
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
      
    }),
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
        
        const passwordsMatch = await compare(password, users[0].password!);
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

    async signIn({ user, account, profile, email, credentials }) {
      // Works when signed in via google.
      if('method' in user && user?.method === 'google') {
        
        const email = user?.email;
        const oAuthId = user?.id;
        
        if(typeof email !== 'string' || typeof oAuthId !== 'string') return false;

        try {
          const users = await getUser(email);
          
          if (users.length === 0) {
            console.log(`New user`);
            
            const res = await registerWithGoogle(email, oAuthId);
            console.log(`response of signing in with google ${res}`);
          }
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          return false;
        }

        return true;
      }
      
      return true;
    },
    
    async jwt({ token, user, account, profile, isNewUser }) {

      if (user) {
        console.log('if user');

        if (!profile) {
          token.id = user.id;
        }

        else{
          const dbUser = await getUser(user.email!);
          if(dbUser.length === 0) return token;
          token.id = dbUser[0].id;
        }
        
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId;
        token.subscriptionEndDate = user.subscriptionEndDate;
      }
      else if(token.id){

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}auth/subscription-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: token.id }),
          });
      
          if (response.ok) {
            const userSubscription = await response.json();            
            token.subscriptionStatus = userSubscription?.status ?? 'inactive';
          } else {
            console.error('Failed to fetch subscription via API');
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }

      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        
        session.user.email = token.email as string;
        session.user.id = token.id as string; 
        session.user.stripeCustomerId = token.stripeCustomerId as string | null;
        session.user.subscriptionStatus = (token.subscriptionStatus as string) ?? 'inactive';
        session.user.subscriptionEndDate = token.subscriptionEndDate as Date | null;
      }
      
      return session;
    },
  },
});

export const { auth, handlers, signIn, signOut } = handler;