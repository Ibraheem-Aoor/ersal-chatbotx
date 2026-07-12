import { jsonb, numeric, pgTable, text } from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"
import { userModel } from "./auth-user"
import { billingPlanModel } from "./billing-plan"
import { subscriptionModel } from "./subscription"

export const paymentHistoryStatusValues = [
  "paid",
  "failed",
  "refunded",
] as const
export type PaymentHistoryStatus = (typeof paymentHistoryStatusValues)[number]

export const paymentHistoryTypeValues = [
  "new",
  "upgrade",
  "downgrade",
  "renewal",
] as const
export type PaymentHistoryType = (typeof paymentHistoryTypeValues)[number]

export const paymentHistoryModel = pgTable("PaymentHistory", {
  ...sharedColumns,
  userId: bigintAsString()
    .notNull()
    .references(() => userModel.id, { onDelete: "cascade" }),
  subscriptionId: bigintAsString().references(() => subscriptionModel.id, {
    onDelete: "set null",
  }),
  planId: bigintAsString()
    .notNull()
    .references(() => billingPlanModel.id, { onDelete: "restrict" }),
  planName: text().notNull(),
  amount: numeric({ precision: 10, scale: 2 }).notNull(),
  currency: text().notNull().default("SAR"),
  paymentGateway: text().notNull(),
  gatewayPaymentId: text().notNull(),
  type: text().notNull().default("new"),
  status: text().notNull().default("paid"),
  metadata: jsonb().$type<Record<string, unknown>>(),
})
