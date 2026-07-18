"use server"

import { userAdminService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { superAdminActionClient } from "@/lib/safe-action"

export const toggleVerificationAction = superAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(z.object({ verified: z.boolean() }))
  .action(async ({ bindArgsParsedInputs: [userId], parsedInput }) => {
    await userAdminService.toggleVerification({
      id: userId,
      verified: parsedInput.verified,
    })
    revalidatePath("/admin/users")
  })
