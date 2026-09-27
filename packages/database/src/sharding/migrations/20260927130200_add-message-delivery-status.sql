-- Shard migration: add-message-delivery-status
-- Version: 20260927130200

DO $$ BEGIN
  CREATE TYPE "messageDeliveryStatus" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "status" "messageDeliveryStatus" DEFAULT 'pending';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deliveredAt" timestamp with time zone;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" timestamp with time zone;

-- Backfill outgoing messages only (historical approximation).
UPDATE "Message" SET "status" = 'failed' WHERE "messageType" = 'outgoing' AND "sendError" IS NOT NULL AND "status" = 'pending';
UPDATE "Message" SET "status" = 'sent' WHERE "messageType" = 'outgoing' AND "sendError" IS NULL AND "status" = 'pending';
UPDATE "Message" SET "status" = NULL WHERE "messageType" != 'outgoing' AND "status" IS NOT NULL;
