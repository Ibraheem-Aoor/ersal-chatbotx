"use server"

import {
  flowService,
  userQuotaService,
  workspaceService,
} from "@chatbotx.io/business"
import { flowLimitReachedException } from "@chatbotx.io/business/errors"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"

export const duplicateFlowAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString(), zodBigintAsString()])
  .action(async ({ bindArgsParsedInputs: [workspaceId, id] }) => {
    // FORK PATCH: Enforce flow quota before duplicating
    const workspace = await workspaceService.findById({ id: workspaceId })
    const canCreate = await userQuotaService.tryConsumeFlow(workspace.ownerId)
    if (!canCreate) {
      throw flowLimitReachedException()
    }

    return flowService.duplicate({ workspaceId, id })
  })
