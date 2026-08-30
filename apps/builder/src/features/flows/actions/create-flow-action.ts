"use server"

import { userQuotaService, workspaceService } from "@chatbotx.io/business"
import { flowLimitReachedException } from "@chatbotx.io/business/errors"
import { db } from "@chatbotx.io/database/client"
import { rootFolderId } from "@chatbotx.io/database/partials"
import {
  flowAnalyticsSessionModel,
  flowModel,
  flowVersionModel,
} from "@chatbotx.io/database/schema"
import { sendMessageNodeDefaultFn } from "@chatbotx.io/flow-config"
import { createId } from "@chatbotx.io/utils"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { ensureFolderIsExists } from "@/features/folders/actions/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import { type CreateFlowSchema, createFlowSchema } from "../schemas/action"

export const createFlowAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(createFlowSchema)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: CreateFlowSchema
    }) => {
      // FORK PATCH: Enforce flow quota before creating
      const workspace = await workspaceService.findById({ id: workspaceId })
      const canCreate = await userQuotaService.tryConsumeFlow(workspace.ownerId)
      if (!canCreate) {
        throw flowLimitReachedException()
      }

      if (parsedInput.folderId) {
        await ensureFolderIsExists(parsedInput.folderId, workspaceId, "flow")
      }

      const defaultNode = sendMessageNodeDefaultFn({
        dataProps: {
          name: "Send Message #1",
          isStartNode: true,
        },
      })

      const flow = await db.transaction(async (tx) => {
        const flowId = createId()
        // rootFolderId ("0") is a UI sentinel — coerce to null for DB insert
        const folderId =
          parsedInput.folderId && parsedInput.folderId !== rootFolderId
            ? parsedInput.folderId
            : null
        const flow = await tx
          .insert(flowModel)
          .values({
            ...parsedInput,
            folderId,
            id: flowId,
            workspaceId,
          })
          .returning()
          .then((result) => result[0])

        await tx.insert(flowAnalyticsSessionModel).values({
          id: createId(),
          workspaceId,
          flowId,
        })

        await tx.insert(flowVersionModel).values({
          id: createId(),
          workspaceId,
          flowId,
          // biome-ignore lint/suspicious/noExplicitAny: temporary any to bypass circular dependency between flow and flow version
          nodes: [defaultNode as any],
          edges: [],
          isDraft: true,
          startNodeId: defaultNode.id,
        })

        return flow
      })

      return { id: flow.id }
    },
  )
