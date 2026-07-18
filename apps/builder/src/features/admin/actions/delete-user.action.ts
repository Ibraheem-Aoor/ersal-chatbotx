"use server"

import { isSuperAdmin, userAdminService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { findOrFail } from "@chatbotx.io/database/client"
import { userModel } from "@chatbotx.io/database/schema"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { revalidatePath } from "next/cache"
import { superAdminActionClient } from "@/lib/safe-action"

export const deleteUserAction = superAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .action(async ({ bindArgsParsedInputs: [userId], ctx }) => {
    if (userId === ctx.user.id) {
      throw new ChatbotXException("Cannot delete your own account")
    }
    const target = await findOrFail({ table: userModel, where: { id: userId } })
    if (isSuperAdmin(target)) {
      throw new ChatbotXException("Cannot delete a platform admin")
    }
    await userAdminService.deleteUser({ id: userId })
    revalidatePath("/admin/users")
  })
