import { sql } from "drizzle-orm"
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
} from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"

export const billingCycleValues = ["monthly", "yearly"] as const
export type BillingCycle = (typeof billingCycleValues)[number]

export const billingCycle = pgEnum("billingCycle", billingCycleValues)

export type BillingPlanLimits = {
  contacts: number
  mac: number
  workspaces: number
  channels: number
  teamMembers: number
  flows: number
  broadcasts: number
  aiAgents: boolean
  removeBranding: boolean
}

export const billingPlanModel = pgTable("BillingPlan", {
  ...sharedColumns,
  organizationId: bigintAsString().notNull().default(sql`'1'`),
  name: text().notNull(),
  description: text(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  currency: text().notNull().default("SAR"),
  billingCycle: billingCycle().notNull().default("monthly"),
  limits: jsonb().$type<BillingPlanLimits>().notNull(),
  features: jsonb().$type<string[]>().notNull().default(sql`'[]'`),
  isActive: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
})
