"use server"

import { buildContext } from "@chatbotx.io/business"
import { db, eq, findOrFail } from "@chatbotx.io/database/client"
import {
  integrationWhatsappModel,
  whatsappMessageTemplateModel,
} from "@chatbotx.io/database/schema"
import type { WhatsappAuthValue } from "@chatbotx.io/integration-whatsapp"
import { z } from "zod"
import {
  type WorkspaceIdAndIdRequestParams,
  workspaceIdAndIdRequestParams,
} from "@/features/common/schemas"
import { integrations } from "@/integration"
import { workspaceActionClient } from "@/lib/safe-action"

const deleteMessageTemplateInput = z.object({
  templateId: z.string(),
})

type DeleteMessageTemplateInput = z.infer<typeof deleteMessageTemplateInput>

export const deleteMessageTemplateAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdAndIdRequestParams)
  .inputSchema(deleteMessageTemplateInput)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId, integrationWhatsappId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdAndIdRequestParams
      parsedInput: DeleteMessageTemplateInput
    }) => {
      const integrationWhatsapp = await findOrFail({
        table: integrationWhatsappModel,
        where: { workspaceId, id: integrationWhatsappId },
        message: "Whatsapp integration not found",
      })

      const template = await findOrFail({
        table: whatsappMessageTemplateModel,
        where: { id: parsedInput.templateId },
        message: "Template not found",
      })

      const ctx = await buildContext({
        workspaceId,
        integrationType: "whatsapp",
        integration: {
          ...integrationWhatsapp,
          auth: integrationWhatsapp.auth as WhatsappAuthValue,
        },
      })

      await integrations.whatsapp.runAction("deleteMessageTemplate", {
        ctx,
        data: { name: template.name },
      })

      await db
        .delete(whatsappMessageTemplateModel)
        .where(eq(whatsappMessageTemplateModel.id, parsedInput.templateId))
    },
  )
