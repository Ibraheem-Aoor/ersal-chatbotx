"use server"

import { aiAgentService, userQuotaService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { getTranslations } from "next-intl/server"
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
      ctx,
    } = props

    const enabled = await userQuotaService.isFeatureEnabled(
      ctx.workspace.ownerId,
      "aiAgentsEnabled",
    )
    if (!enabled) {
      const t = await getTranslations("billing.quotaLimits")
      throw new ChatbotXException(t("aiAgentsNotEnabled"), "quotaExceeded", 422)
    }

    await aiAgentService.create(workspaceId, parsedInput)
  })
