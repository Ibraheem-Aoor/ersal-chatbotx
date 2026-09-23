"use server"

import { buildContext } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { db, eq, findOrFail } from "@chatbotx.io/database/client"
import {
  integrationWhatsappModel,
  whatsappMessageTemplateModel,
} from "@chatbotx.io/database/schema"
import type {
  EditMessageTemplateProps,
  WhatsappAuthValue,
} from "@chatbotx.io/integration-whatsapp"
import { SdkException } from "@chatbotx.io/sdk"
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
import {
  extractMetaErrorDetails,
  mapTemplateError,
} from "./template-error-mapper"
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

      if (template.status === "PENDING") {
        throw new Error(
          "Cannot edit a template that is pending review. Only APPROVED or REJECTED templates can be edited.",
        )
      }

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

      try {
        await integrations.whatsapp.runAction("editMessageTemplate", {
          ctx,
          data: editData,
        })
      } catch (error) {
        if (error instanceof SdkException) {
          throw new ChatbotXException(
            mapTemplateError(extractMetaErrorDetails(error)),
          )
        }
        throw error
      }

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
