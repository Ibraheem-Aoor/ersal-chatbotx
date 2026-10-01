ALTER TABLE "ContactInbox" ADD COLUMN IF NOT EXISTS "sourceUserId" text;--> statement-breakpoint
ALTER TABLE "ContactInbox" ADD COLUMN IF NOT EXISTS "sourceUsername" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ContactInbox_inboxId_sourceUserId_key" ON "ContactInbox" ("inboxId","sourceUserId") WHERE "sourceUserId" IS NOT NULL;