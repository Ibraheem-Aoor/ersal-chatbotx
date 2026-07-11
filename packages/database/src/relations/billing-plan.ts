import { defineRelationsPart } from "drizzle-orm"
// biome-ignore lint/performance/noNamespaceImport: drizzle schema
import * as schema from "../schema"

export const billingPlanRelations = defineRelationsPart(schema, (r) => ({
  billingPlanModel: {
    subscriptions: r.many.subscriptionModel({
      from: r.billingPlanModel.id,
      to: r.subscriptionModel.planId,
    }),
  },
}))
