import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import { pgTable, varchar, timestamp, json, uuid, text } from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  password: varchar("password", { length: 64 }).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
});

export type User = InferSelectModel<typeof user>;

export const subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  stripeSubscriptionId: varchar('stripeSubscriptionId', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
  priceId: varchar('priceId', { length: 255 }).notNull(),
  currentPeriodStart: timestamp('currentPeriodStart').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd').notNull()
});

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Subscription = InferSelectModel<typeof subscription>;
export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

// This is how we should properly extend the next-auth types
declare module "next-auth" {
  interface User {
    stripeCustomerId?: string | null;
    subscriptionStatus: string;
    subscriptionEndDate?: Date | null;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      stripeCustomerId?: string | null;
      subscriptionStatus: string;
      subscriptionEndDate?: Date | null;
    }
  }
}