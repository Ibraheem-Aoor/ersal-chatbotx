CREATE TABLE IF NOT EXISTS "BillingInfo" (
  "id" bigint PRIMARY KEY,
  "createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "userId" bigint NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "companyName" text NOT NULL,
  "vatNumber" text,
  "billingEmail" text NOT NULL,
  "country" text NOT NULL DEFAULT 'SA',
  "city" text,
  "address" text,
  CONSTRAINT "BillingInfo_userId_unique" UNIQUE("userId")
);
