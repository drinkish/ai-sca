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
    // Google OAuth provider configuration
    GoogleProvider({
      // Add method property to profile to identify Google auth users
      profile(profile){
        return {
          ...profile,
          method: "google" // Used to identify Google OAuth users in signIn callback
        }
      },
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }),
    // Email/Password provider configuration
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
          
          // Get subscription data for the user
          const subscriptionData = await getSubscription(userWithoutPassword.id);
          
          // Return user object with subscription status
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
    strategy: "jwt", // Use JWT strategy for session handling
    maxAge: 30 * 24 * 60 * 60, // 30 days session duration
  },
  callbacks: {

    // Called when a user signs in
    async signIn({ user }) {
      // Handle Google OAuth sign-in
      if('method' in user && user?.method === 'google') {
        console.log("Google user logged in");

        const email = user?.email;
        const oAuthId = user?.id;
        
        if(typeof email !== 'string' || typeof oAuthId !== 'string') return false;


        // Check if user exists in our database
        const users = await getUser(email);
        if (users.length === 0) {
          console.log(`New user`);
          // Register new Google user
          await registerWithGoogle(email, oAuthId);
          // Get the newly created user to set their database ID
          const newUsers = await getUser(email);
          if (newUsers.length > 0) {
            // Important: Set the database ID on the user object
            user.id = newUsers[0].id;
          }
        } else {
          // Set the database ID for existing users
          user.id = users[0].id;

        }
        return true;
      }
      return true;
    },
    

    // Called whenever a JWT is created or updated
    async jwt({ token, user }) {
      if (user) {
        // Copy important user data to the token
        // This ensures the data persists across sessions
        token.id = user.id;
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionEndDate = user.subscriptionEndDate;
      }
      
      // Always fetch fresh subscription data when checking the token
      if (token.id && typeof token.id === 'string') {
        try {
          const subscriptionData = await getSubscription(token.id);
          if (subscriptionData) {
            token.subscriptionStatus = subscriptionData.status;
            token.subscriptionEndDate = subscriptionData.currentPeriodEnd;
          } else {
            token.subscriptionStatus = 'inactive';
            token.subscriptionEndDate = null;
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
      }

      return token;
    },


    // Called whenever a session is checked
    async session({ session, token }) {
      if (session.user) {
        // Copy data from the token to the session
        // This makes the data available on the client side
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