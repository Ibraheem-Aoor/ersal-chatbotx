"use server"

import { billingPlanService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { platformAdminActionClient } from "@/lib/safe-action"
import { updatePlanSchema } from "../schema/plan"

export const updatePlanAction = platformAdminActionClient
  .inputSchema(updatePlanSchema)
  .bindArgsSchemas([zodBigintAsString()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [planId] }) => {
    const existing = await billingPlanService.findById({ id: planId })
    if (!existing) {
      throw new ChatbotXException("Plan not found")
    }
    const plan = await billingPlanService.update({
      id: planId,
      data: parsedInput,
    })
    if (parsedInput.isDefault) {
      await billingPlanService.setDefault({ id: planId })
    }
    // Propagate updated limits to all active/trial subscribers on this plan.
    // Fixes stale-limits bug: without this, existing users keep old limits
    // until their next renewal cycle.
    if (parsedInput.limits) {
      await billingPlanService.propagatePlanLimits({ planId })
    }
    return plan
  })
