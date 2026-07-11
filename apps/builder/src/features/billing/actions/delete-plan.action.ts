"use server"

import { billingPlanService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { platformAdminActionClient } from "@/lib/safe-action"

export const deletePlanAction = platformAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .action(async ({ bindArgsParsedInputs: [planId] }) => {
    const existing = await billingPlanService.findById({ id: planId })
    if (!existing) {
      throw new ChatbotXException("Plan not found")
    }
    await billingPlanService.delete({ id: planId })
  })
