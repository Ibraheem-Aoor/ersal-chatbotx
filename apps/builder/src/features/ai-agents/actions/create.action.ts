"use server"

import {
  aiAgentService,
  userQuotaService,
  workspaceService,
} from "@chatbotx.io/business"
import { aiAgentDisabledException } from "@chatbotx.io/business/errors"
import { createAIAgentRequest } from "@/features/ai-agents/schemas/action"
import { workspaceIdrequestParams } from "@/features/common/schemas"
import { workspaceActionClient } from "@/lib/safe-action"

export const createAIAgentAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(createAIAgentRequest)
  .action(async (props) => {
    const {
      parsedInput,
      bindArgsParsedInputs: [workspaceId],
    } = props

    // FORK PATCH: Enforce AI agent quota before creating
    const workspace = await workspaceService.findById({ id: workspaceId })
    const enabled = await userQuotaService.isAiAgentEnabled(workspace.ownerId)
    if (!enabled) {
      throw aiAgentDisabledException()
    }

    await aiAgentService.create(workspaceId, parsedInput)
  })
