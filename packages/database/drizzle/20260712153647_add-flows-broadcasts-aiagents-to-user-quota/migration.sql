ALTER TABLE "UserQuota" ADD COLUMN "flowsLimit" integer;--> statement-breakpoint
ALTER TABLE "UserQuota" ADD COLUMN "flowsUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserQuota" ADD COLUMN "broadcastsLimit" integer;--> statement-breakpoint
ALTER TABLE "UserQuota" ADD COLUMN "broadcastsUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserQuota" ADD COLUMN "aiAgentsEnabled" boolean DEFAULT true NOT NULL;