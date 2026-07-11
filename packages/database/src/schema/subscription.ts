import { numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import {
  bigintAsString,
  sharedColumns,
  timestampConfig,
} from "../partials/shared"
import { userModel } from "./auth-user"
import { billingPlanModel } from "./billing-plan"

export const subscriptionStatusValues = [
  "active",
  "trial",
  "expired",
  "past_due",
  "cancelled",
] as const
export type SubscriptionStatus = (typeof subscriptionStatusValues)[number]

export const subscriptionStatus = pgEnum(
  "subscriptionStatus",
  subscriptionStatusValues,
)

export const billingCycleValues = ["monthly", "yearly"] as const
export type BillingCycle = (typeof billingCycleValues)[number]

export const billingCycle = pgEnum("billingCycle", billingCycleValues)

export const subscriptionModel = pgTable("Subscription", {
  ...sharedColumns,
  userId: bigintAsString()
    .notNull()
    .references(() => userModel.id, { onDelete: "cascade" }),
  planId: bigintAsString()
    .notNull()
    .references(() => billingPlanModel.id, { onDelete: "restrict" }),
  status: subscriptionStatus().notNull().default("active"),
  cycle: billingCycle().notNull().default("monthly"),
  amount: numeric({ precision: 10, scale: 2 }).notNull(),
  currency: text().notNull().default("SAR"),
  paymentGateway: text(),
  gatewayPaymentId: text(),
  currentPeriodStart: timestamp(timestampConfig).notNull(),
  currentPeriodEnd: timestamp(timestampConfig).notNull(),
})
