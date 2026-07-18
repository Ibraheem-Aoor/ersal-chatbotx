"use server"

import { userAdminService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { revalidatePath } from "next/cache"
import { superAdminActionClient } from "@/lib/safe-action"

export const deleteUserAction = superAdminActionClient
  .bindArgsSchemas([zodBigintAsString()])
  .action(async ({ bindArgsParsedInputs: [userId], ctx }) => {
    if (userId === ctx.user.id) {
      throw new ChatbotXException("Cannot delete your own account")
    }
    await userAdminService.deleteUser({ id: userId })
    revalidatePath("/admin/users")
  })
