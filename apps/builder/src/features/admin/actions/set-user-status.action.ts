"use server"

import type { UserAccountStatus } from "@chatbotx.io/business"
import { isSuperAdmin, userAdminService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { findOrFail } from "@chatbotx.io/database/client"
import { userModel } from "@chatbotx.io/database/schema"
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
    const target = await findOrFail({ table: userModel, where: { id: userId } })
    if (isSuperAdmin(target)) {
      throw new ChatbotXException("Cannot modify a platform admin")
    }
    await userAdminService.setStatus({
      id: userId,
      status: parsedInput.status as UserAccountStatus,
    })
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
  })
