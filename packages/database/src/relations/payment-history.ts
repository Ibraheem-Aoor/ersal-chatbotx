import { defineRelationsPart } from "drizzle-orm"
// biome-ignore lint/performance/noNamespaceImport: drizzle schema
import * as schema from "../schema"

export const paymentHistoryRelations = defineRelationsPart(schema, (r) => ({
  paymentHistoryModel: {
    user: r.one.userModel({
      from: r.paymentHistoryModel.userId,
      to: r.userModel.id,
    }),
    subscription: r.one.subscriptionModel({
      from: r.paymentHistoryModel.subscriptionId,
      to: r.subscriptionModel.id,
    }),
    plan: r.one.billingPlanModel({
      from: r.paymentHistoryModel.planId,
      to: r.billingPlanModel.id,
    }),
  },
}))
