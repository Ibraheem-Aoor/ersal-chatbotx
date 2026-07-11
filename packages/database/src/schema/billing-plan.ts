import { sql } from "drizzle-orm"
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
} from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"

export type BillingPlanLimits = {
  contacts: number
  mac: number
  workspaces: number
  channels: number
  teamMembers: number
  flows: number
  broadcasts: boolean
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
  limits: jsonb().$type<BillingPlanLimits>().notNull(),
  features: jsonb().$type<string[]>().notNull().default(sql`'[]'`),
  isActive: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
})
