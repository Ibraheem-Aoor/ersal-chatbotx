import { defineRelationsPart } from "drizzle-orm"
// biome-ignore lint/performance/noNamespaceImport: drizzle schema
import * as schema from "../schema"

export const subscriptionRelations = defineRelationsPart(schema, (r) => ({
  subscriptionModel: {
    user: r.one.userModel({
      from: r.subscriptionModel.userId,
      to: r.userModel.id,
    }),
    plan: r.one.billingPlanModel({
      from: r.subscriptionModel.planId,
      to: r.billingPlanModel.id,
    }),
  },
}))
