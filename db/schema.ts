import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import { pgTable, varchar, timestamp, json, uuid, text } from "drizzle-orm/pg-core";

// User table remains the same
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  password: varchar("password", { length: 64 }).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: text('subscription_status').notNull().default('inactive'),
  subscriptionEndDate: timestamp('subscription_end_date'),
});

export type User = InferSelectModel<typeof user>;

// Chat table remains the same
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

// Updated subscription table
export const subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id),
  stripeSubscriptionId: varchar('stripeSubscriptionId', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
  priceId: varchar('priceId', { length: 255 }).notNull(),
  currentPeriodStart: timestamp('currentPeriodStart', { mode: 'date' }).notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd', { mode: 'date' }).notNull()
});

// Add subscription types
export type Subscription = InferSelectModel<typeof subscription>;
export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

// Chat type remains the same
export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

// NextAuth type declaration remains the same
declare module "next-auth" {
  interface User extends Omit<InferSelectModel<typeof user>, "password"> {}
}