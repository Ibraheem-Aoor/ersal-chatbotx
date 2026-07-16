import { defineRelationsPart } from "drizzle-orm"
// biome-ignore lint/performance/noNamespaceImport: drizzle schema
import * as schema from "../schema"

export const billingInfoRelations = defineRelationsPart(schema, (r) => ({
  billingInfoModel: {
    user: r.one.userModel({
      from: r.billingInfoModel.userId,
      to: r.userModel.id,
    }),
  },
}))
