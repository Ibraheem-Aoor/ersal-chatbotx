"use server"

import { workspaceService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { getTranslations } from "next-intl/server"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { hasWorkspacePermission } from "@/lib/auth/permission-routes"
import { getCurrentUserAndTargetWorkspace } from "@/lib/auth/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type UpdateWorkspaceStatusRequest,
  updateWorkspaceStatusRequest,
} from "../schema/update-workspace-schema"

export const updateWorkspaceStatusAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(updateWorkspaceStatusRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: UpdateWorkspaceStatusRequest
    }) => {
      const t = await getTranslations("billing.errors")
      const currentUserAndTargetWorkspace =
        await getCurrentUserAndTargetWorkspace(workspaceId)
      if (!currentUserAndTargetWorkspace) {
        throw new ChatbotXException(t("notAuthorizedUpdateWorkspace"))
      }

      const { permissions } =
        currentUserAndTargetWorkspace.targetWorkspaceMember
      if (!hasWorkspacePermission(permissions, "superAdmin")) {
        throw new ChatbotXException(t("superAdminRequiredSchedule"))
      }

      await workspaceService.update({ id: workspaceId, data: parsedInput })
    },
  )
