"use server"

import { buildContext } from "@chatbotx.io/business"
import { db, findOrFail } from "@chatbotx.io/database/client"
import {
  integrationWhatsappModel,
  whatsappMessageTemplateModel,
} from "@chatbotx.io/database/schema"
import type {
  CreateMessageTemplateProps,
  WhatsappAuthValue,
} from "@chatbotx.io/integration-whatsapp"
import { createId } from "@chatbotx.io/utils"
import {
  type WorkspaceIdAndIdRequestParams,
  workspaceIdAndIdRequestParams,
} from "@/features/common/schemas"
import { integrations } from "@/integration"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type CreateMessageTemplateRequest,
  createMessageTemplateRequest,
} from "../schema/mutation"
import { parseComponents } from "./utils"

export const createMessageTemplateAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdAndIdRequestParams)
  .inputSchema(createMessageTemplateRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId, integrationWhatsappId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdAndIdRequestParams
      parsedInput: CreateMessageTemplateRequest
    }) => {
      const integrationWhatsapp = await findOrFail({
        table: integrationWhatsappModel,
        where: { workspaceId, id: integrationWhatsappId },
        message: "Whatsapp integration not found",
      })

      const ctx = await buildContext({
        workspaceId,
        integrationType: "whatsapp",
        integration: {
          ...integrationWhatsapp,
          auth: integrationWhatsapp.auth as WhatsappAuthValue,
        },
      })

      const body: CreateMessageTemplateProps = {
        name: parsedInput.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, ""),
        category: parsedInput.category,
        language: parsedInput.language,
        components: await parseComponents(
          ctx,
          parsedInput.templateType,
          parsedInput.content,
        ),
      }

      console.log(
        "[createMessageTemplate] Sending to Meta API:",
        JSON.stringify(body, null, 2),
      )

      const res = await integrations.whatsapp.runAction(
        "createMessageTemplate",
        {
          ctx,
          data: body,
        },
      )

      await db.insert(whatsappMessageTemplateModel).values({
        id: createId(),
        name: parsedInput.name,
        integrationWhatsappId: integrationWhatsapp.id,
        language: parsedInput.language,
        category: parsedInput.category,
        status: res.status,
        sourceId: res.id,
      })
    },
  )
