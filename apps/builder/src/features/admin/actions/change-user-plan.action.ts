"use server"

import { userAdminService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { superAdminActionClient } from "@/lib/safe-action"

export const changeUserPlanAction = superAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(z.object({ planId: zodBigintAsString() }))
  .action(async ({ bindArgsParsedInputs: [userId], parsedInput }) => {
    const result = await userAdminService.changePlan({
      userId,
      planId: parsedInput.planId,
    })
    if (!result.success) {
      throw new Error(result.error)
    }
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { planName: result.planName }
  })
