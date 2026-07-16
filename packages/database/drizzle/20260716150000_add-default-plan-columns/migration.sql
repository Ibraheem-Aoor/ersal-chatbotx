ALTER TABLE "BillingPlan" ADD COLUMN "isDefault" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "BillingPlan" ADD COLUMN "trialDays" integer;
