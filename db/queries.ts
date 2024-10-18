"server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User } from "./schema";

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

try {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined in the environment variables");
  }

  // Use SSL only if not in a local environment
  const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;

  client = postgres(process.env.POSTGRES_URL, { 
    ssl,
    max: 1,
    connect_timeout: 10,
  });
  
  db = drizzle(client);
  
  console.log("Database connection established successfully");
} catch (error) {
  console.error("Failed to establish database connection:", error);
  throw error;
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    console.log(`Attempting to get user with email: ${email}`);
    const result = await db.select().from(user).where(eq(user.email, email));
    console.log(`User query result:`, result);
    return result;
  } catch (error) {
    console.error("Failed to get user from database:", error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    console.log(`Attempting to create user with email: ${email}`);
    const result = await db.insert(user).values({ 
      email, 
      password: hash,
      stripeCustomerId: null,
      subscriptionStatus: 'inactive',
      subscriptionEndDate: null
    });
    console.log(`User creation result:`, result);
    return result;
  } catch (error) {
    console.error("Failed to create user in database:", error);
    throw error;
  }
}


export async function updateUserSubscription(userId: string, stripeCustomerId: string, subscriptionStatus: string, subscriptionEndDate: Date) {
  try {
    return await db.update(user)
      .set({ 
        stripeCustomerId, 
        subscriptionStatus, 
        subscriptionEndDate 
      })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to update user subscription in database");
    throw error;
  }
}


export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
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

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}
