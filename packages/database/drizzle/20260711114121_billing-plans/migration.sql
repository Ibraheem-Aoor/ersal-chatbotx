CREATE TYPE "billingCycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "subscriptionStatus" AS ENUM('active', 'trial', 'expired', 'past_due', 'cancelled');--> statement-breakpoint
CREATE TABLE "BillingPlan" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"organizationId" bigint DEFAULT '1' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10,2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"limits" jsonb NOT NULL,
	"features" jsonb DEFAULT '[]' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  -- Drop the upstream Stripe-based Subscription table ONLY if it exists
  -- with its Stripe-specific "stripeCustomerId" column. This protects
  -- against accidentally dropping our Moyasar-based Subscription table
  -- if this migration re-runs against a DB that already has our schema.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Subscription' AND column_name = 'stripeCustomerId'
  ) THEN
    DROP TABLE "Subscription" CASCADE;
  END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"userId" bigint NOT NULL,
	"planId" bigint NOT NULL,
	"status" "subscriptionStatus" DEFAULT 'active'::"subscriptionStatus" NOT NULL,
	"cycle" "billingCycle" DEFAULT 'monthly'::"billingCycle" NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"paymentGateway" text,
	"gatewayPaymentId" text,
	"currentPeriodStart" timestamp(6) with time zone NOT NULL,
	"currentPeriodEnd" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_BillingPlan_id_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT;
