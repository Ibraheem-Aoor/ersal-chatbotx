"use server"

import { ChatbotXException } from "@chatbotx.io/business/errors"
import { db, findOrFail } from "@chatbotx.io/database/client"
import { conversationModel } from "@chatbotx.io/database/schema"
import { waTemplateParamsSchema } from "@chatbotx.io/flow-config"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { ChatJobAction, chatQueue } from "@chatbotx.io/worker-config"
import { z } from "zod"
import { workspaceActionClient } from "@/lib/safe-action"

const sendTemplateInput = z.object({
  templateId: zodBigintAsString(),
  templateData: waTemplateParamsSchema.optional(),
})

export const sendTemplateAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString(), zodBigintAsString()])
  .inputSchema(sendTemplateInput)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId, conversationId],
      parsedInput,
    }) => {
      const conversation = await findOrFail({
        table: conversationModel,
        where: { id: conversationId, workspaceId },
        message: "Conversation not found",
      })

      const contactInbox = await db.query.contactInboxModel.findFirst({
        where: { contactId: conversation.contactId },
        orderBy: { lastMessageAt: "desc" },
      })
      if (!contactInbox) {
        throw new ChatbotXException("Contact inbox not found")
      }

      await chatQueue.add(ChatJobAction.sendWhatsappTemplateMessage, {
        type: ChatJobAction.sendWhatsappTemplateMessage,
        data: {
          conversation,
          contactInbox,
          templateId: parsedInput.templateId,
          templateData: parsedInput.templateData,
          broadcastId: "",
        },
      })

      return { success: true }
    },
  )
