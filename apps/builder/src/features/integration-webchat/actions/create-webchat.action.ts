"use server"

import { inboxService, workspaceService } from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { db } from "@chatbotx.io/database/client"
import { integrationWebchatModel } from "@chatbotx.io/database/schema"
import { createId } from "@chatbotx.io/utils"
import { authActionClient } from "@/lib/safe-action"
import { translateQuotaError } from "@/lib/translate-business-error"
import { createWebchatRequest } from "../schema/mutation"

export const createWebchatAction = authActionClient
  .inputSchema(createWebchatRequest)
  .action(async ({ parsedInput, ctx }) => {
    const { authorizedDomains, ...rest } = parsedInput

    let workspaceId = parsedInput.workspaceId
    let ownerId = ctx.user.id

    try {
      await db.transaction(async (tx) => {
        if (workspaceId) {
          const workspace = await workspaceService.findOrFail({
            where: { id: workspaceId },
          })
          ownerId = workspace.ownerId
        } else {
          const newChatbot = await workspaceService.create({
            tx,
            createdBy: ownerId,
            data: {
              name: parsedInput.name,
              timezone: "UTC",
              ownerId,
            },
          })
          workspaceId = newChatbot.id
        }

        const webchatId = createId()
        const { inbox } = await inboxService.create({
          tx,
          ownerId,
          data: {
            id: webchatId,
            workspaceId,
            channel: "webchat",
            name: rest.name,
            sourceId: webchatId,
          },
        })

        await tx.insert(integrationWebchatModel).values({
          ...rest,
          id: webchatId,
          authorizedDomains: authorizedDomains.map((domain) => domain.value),
          workspaceId,
          inboxId: inbox.id,
          auth: {},
        })
      })
    } catch (error) {
      if (error instanceof ChatbotXException) {
        throw await translateQuotaError(error)
      }
      throw error
    }

    return {
      workspaceId,
    }
  })
