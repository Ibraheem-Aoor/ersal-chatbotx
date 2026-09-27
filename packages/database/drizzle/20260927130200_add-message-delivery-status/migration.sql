-- Add delivery status tracking to Message table.
-- Backfill note: outgoing messages with sendError → 'failed', other outgoing → 'sent'
-- (historical approximation — we cannot know true delivered/read for past messages).
-- Incoming messages are left NULL (delivery status is an outgoing-only concept).
CREATE TYPE "messageDeliveryStatus" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "status" "messageDeliveryStatus" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "deliveredAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "readAt" timestamp with time zone;

-- Backfill outgoing messages only (historical approximation — we cannot
-- know true delivered/read for past messages).
-- Incoming messages are left NULL (delivery status is an outgoing-only concept).
UPDATE "Message" SET "status" = 'failed' WHERE "messageType" = 'outgoing' AND "sendError" IS NOT NULL;
UPDATE "Message" SET "status" = 'sent' WHERE "messageType" = 'outgoing' AND "sendError" IS NULL AND "status" = 'pending';
UPDATE "Message" SET "status" = NULL WHERE "messageType" != 'outgoing';
