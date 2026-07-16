"use server"

import { billingPlanService } from "@chatbotx.io/business"
import { platformAdminActionClient } from "@/lib/safe-action"
import { createPlanSchema } from "../schema/plan"

export const createPlanAction = platformAdminActionClient
  .inputSchema(createPlanSchema)
  .action(async ({ parsedInput }) => {
    const plan = await billingPlanService.create({ data: parsedInput })
    if (parsedInput.isDefault) {
      await billingPlanService.setDefault({ id: plan.id })
    }
    return plan
  })
