"use server"

import { buildContext } from "@chatbotx.io/business"
import { db, eq, findOrFail } from "@chatbotx.io/database/client"
import {
  integrationWhatsappModel,
  whatsappMessageTemplateModel,
} from "@chatbotx.io/database/schema"
import type {
  EditMessageTemplateProps,
  WhatsappAuthValue,
} from "@chatbotx.io/integration-whatsapp"
import {
  type WorkspaceIdAndIdRequestParams,
  workspaceIdAndIdRequestParams,
} from "@/features/common/schemas"
import { integrations } from "@/integration"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type EditMessageTemplateRequest,
  editMessageTemplateRequest,
} from "../schema/mutation"
import { parseComponents } from "./utils"

export const editMessageTemplateAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdAndIdRequestParams)
  .inputSchema(editMessageTemplateRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId, integrationWhatsappId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdAndIdRequestParams
      parsedInput: EditMessageTemplateRequest
    }) => {
      const integrationWhatsapp = await findOrFail({
        table: integrationWhatsappModel,
        where: { workspaceId, id: integrationWhatsappId },
        message: "Whatsapp integration not found",
      })

      // Fetch the existing template to get sourceId
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

      const components = await parseComponents(
        ctx,
        parsedInput.templateType,
        parsedInput.content,
      )

      const editData: EditMessageTemplateProps = {
        templateId: template.sourceId,
        components,
      }

      console.log(
        "[editMessageTemplate] Sending to Meta API:",
        JSON.stringify(editData, null, 2),
      )

      await integrations.whatsapp.runAction("editMessageTemplate", {
        ctx,
        data: editData,
      })

      // After editing, status goes back to PENDING for approved templates
      await db
        .update(whatsappMessageTemplateModel)
        .set({
          status: "PENDING",
          components: JSON.stringify(components),
        })
        .where(eq(whatsappMessageTemplateModel.id, parsedInput.templateId))
    },
  )
