"use server"

import type { UserAccountStatus } from "@chatbotx.io/business"
import { userAdminService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { superAdminActionClient } from "@/lib/safe-action"

export const setUserStatusAction = superAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .inputSchema(
    z.object({
      status: z.enum(["active", "suspended", "banned"]),
    }),
  )
  .action(async ({ bindArgsParsedInputs: [userId], parsedInput, ctx }) => {
    if (userId === ctx.user.id) {
      throw new ChatbotXException("Cannot change your own account status")
    }
    await userAdminService.setStatus({
      id: userId,
      status: parsedInput.status as UserAccountStatus,
    })
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
  })
