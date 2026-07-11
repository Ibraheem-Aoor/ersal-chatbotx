"use server"

import { billingPlanService } from "@chatbotx.io/business"
import { platformAdminActionClient } from "@/lib/safe-action"
import { createPlanSchema } from "../schema/plan"

export const createPlanAction = platformAdminActionClient
  .inputSchema(createPlanSchema)
  .action(
    async ({ parsedInput }) =>
      await billingPlanService.create({ data: parsedInput }),
  )
