import { compare } from "bcrypt-ts";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { getUser, getSubscription } from "@/db/queries";

import { registerWithGoogle } from "./actions";
import { authConfig } from "./auth.config";

let globalVar = ''

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
        
        console.log("Google user logged in");
        const email = user?.email;
        const oAuthId = user?.id;
        
        if(typeof email !== 'string' || typeof oAuthId !== 'string') return false;

        const users = await getUser(email);
        globalVar = users[0].id;
        console.log('signedUser');
        console.log(users);
        
        
        if (users.length === 0) {
          console.log(`New user`);
          
          const res = await registerWithGoogle(email, oAuthId);
          console.log(`response of signing in with google ${res}`);
        }

        return true;
      }
      
      return true;
    },
    
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {

        if (!profile) {
          token.id = user.id;
        }
        else{
          
          const dbUser = await getUser(user.email!);
          if(dbUser.length === 0) return token;
          token.id = dbUser[0].id;
        }
        
        const subscriptionStatusDb = await getSubscription(token.id as string);
        token.subscriptionStatus = subscriptionStatusDb?.status;
        console.log('subscriptionStatusDb');
        console.log(token.subscriptionStatus);
        // token.id = account?.providerAccountId;
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId;
        token.subscriptionEndDate = user.subscriptionEndDate;
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