"use server";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";

import { user, chat, subscription, User } from "./schema";

import { db } from "./index";


// User-related queries
export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    console.log("Creating user right before...");
    
    return await db.insert(user).values({ 
      email, 
      password: hash,
      stripeCustomerId: null
    });
  } catch (error) {
    console.error("Failed to create user in database");
    console.error(error);
    throw error;
  }
}

// Subscription-related queries
export async function updateUserStripeId(userId: string, stripeCustomerId: string) {
  try {
    return await db.update(user)
      .set({ stripeCustomerId })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to update user stripe ID in database", error);
    throw error;
  }
}

export async function getSubscription(userId: string) {
  try {
    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId));
    return userSubscription;
  } catch (error) {
    console.error("Failed to get subscription from database", error);
    throw error;
  }
}

export async function upsertSubscription({
  userId,
  stripeSubscriptionId,
  status,
  priceId,
  currentPeriodStart,
  currentPeriodEnd
}: {
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  try {
    const existingSub = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId));

    if (existingSub.length > 0) {
      return await db
        .update(subscription)
        .set({
          stripeSubscriptionId,
          status,
          priceId,
          currentPeriodStart,
          currentPeriodEnd
        })
        .where(eq(subscription.userId, userId));
    }

    return await db
      .insert(subscription)
      .values({
        userId,
        stripeSubscriptionId,
        status,
        priceId,
        currentPeriodStart,
        currentPeriodEnd
      });
  } catch (error) {
    console.error("Failed to upsert subscription in database", error);
    throw error;
  }
}

// Chat-related queries
export async function insertChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to insert chat in database");
    throw error;
  }
}

export async function updateChat(id: string, messages: any) {
  try {
    return await db
      .update(chat)
      .set({
        messages: JSON.stringify(messages),
      })
      .where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to update chat in database");
    throw error;
  }
}

export async function deleteChatById(id: string) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId(id: string) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById(id: string) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}