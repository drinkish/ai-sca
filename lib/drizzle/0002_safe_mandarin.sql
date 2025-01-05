ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "o_auth_id" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "reset_token_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_unique" UNIQUE("userId");