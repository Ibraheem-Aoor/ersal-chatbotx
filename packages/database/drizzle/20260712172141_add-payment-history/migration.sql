CREATE TABLE "PaymentHistory" (
	"id" bigint PRIMARY KEY,
	"createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"userId" bigint NOT NULL,
	"subscriptionId" bigint,
	"planId" bigint NOT NULL,
	"planName" text NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"paymentGateway" text NOT NULL,
	"gatewayPaymentId" text NOT NULL,
	"type" text DEFAULT 'new' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscriptionId_Subscription_id_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_planId_BillingPlan_id_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT;