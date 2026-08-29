"use server"

import {
  flowService,
  userQuotaService,
  workspaceService,
} from "@chatbotx.io/business"
import { flowLimitReachedException } from "@chatbotx.io/business/errors"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import {
  type ImportFlowSchema,
  importFlowSchema,
} from "@/features/flows/schema/action"
import { workspaceActionClient } from "@/lib/safe-action"

export const importFlowAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(importFlowSchema)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: ImportFlowSchema
    }) => {
      // FORK PATCH: Enforce flow quota before importing
      const workspace = await workspaceService.findById({ id: workspaceId })
      const canCreate = await userQuotaService.tryConsumeFlow(workspace.ownerId)
      if (!canCreate) {
        throw flowLimitReachedException()
      }

      // Validate startNodeId references an existing node
      const startNodeExists = parsedInput.nodes.some(
        (node) => node.id === parsedInput.startNodeId,
      )
      if (!startNodeExists) {
        throw new Error("startNodeId does not reference a valid node")
      }

      const flowId = await flowService.importFlow({
        workspaceId,
        name: parsedInput.name,
        active: parsedInput.active,
        enableInInbox: parsedInput.enableInInbox,
        nodes: parsedInput.nodes,
        edges: parsedInput.edges,
        startNodeId: parsedInput.startNodeId,
        folderId: parsedInput.folderId ?? null,
      })

      return { id: flowId }
    },
  )
