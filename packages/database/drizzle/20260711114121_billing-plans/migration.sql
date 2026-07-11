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
CREATE TABLE "IntegrationOpenaiCompatible" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"auth" jsonb,
	"autoReply" boolean DEFAULT false NOT NULL,
	"baseURL" text NOT NULL,
	"defaultModel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"integrationId" bigint NOT NULL,
	"name" text NOT NULL,
	"preset" text NOT NULL,
	"workspaceId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
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
ALTER TABLE "IntegrationInstagram" ADD COLUMN "type" text DEFAULT 'instagram' NOT NULL;--> statement-breakpoint
CREATE INDEX "IntegrationOpenaiCompatible_workspaceId_idx" ON "IntegrationOpenaiCompatible" ("workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "IntegrationOpenaiCompatible_integrationId_key" ON "IntegrationOpenaiCompatible" ("integrationId");--> statement-breakpoint
CREATE UNIQUE INDEX "IntegrationOpenaiCompatible_workspaceId_preset_key" ON "IntegrationOpenaiCompatible" ("workspaceId","preset") WHERE "preset" <> 'custom';--> statement-breakpoint
ALTER TABLE "IntegrationOpenaiCompatible" ADD CONSTRAINT "IntegrationOpenaiCompatible_integrationId_Integration_id_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "IntegrationOpenaiCompatible" ADD CONSTRAINT "IntegrationOpenaiCompatible_workspaceId_Workspace_id_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_BillingPlan_id_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT;