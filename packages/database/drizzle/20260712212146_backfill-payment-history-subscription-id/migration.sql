UPDATE "PaymentHistory" ph
SET "subscriptionId" = sub.id
FROM "Subscription" sub
WHERE ph."subscriptionId" IS NULL
  AND sub."userId" = ph."userId";
