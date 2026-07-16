import { pgTable, text } from "drizzle-orm/pg-core"
import { bigintAsString, sharedColumns } from "../partials/shared"
import { userModel } from "./auth-user"

export const billingInfoModel = pgTable("BillingInfo", {
  ...sharedColumns,
  userId: bigintAsString()
    .notNull()
    .references(() => userModel.id, { onDelete: "cascade" })
    .unique(),
  companyName: text().notNull(),
  vatNumber: text(),
  billingEmail: text().notNull(),
  country: text().notNull().default("SA"),
  city: text(),
  address: text(),
})
