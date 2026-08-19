"use server"

import {
  flowService,
  userQuotaService,
  workspaceService,
} from "@chatbotx.io/business"
import { flowLimitReachedException } from "@chatbotx.io/business/errors"
import { edgeSchema } from "@chatbotx.io/flow-config"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { workspaceActionClient } from "@/lib/safe-action"
import { z } from "zod"

export const importFlowSchema = z.object({
  version: z.number().int().min(1).max(1),
  name: z.string().trim().min(1).max(255),
  active: z.boolean().default(true),
  enableInInbox: z.boolean().default(true),
  nodes: z
    .array(z.object({ id: z.string() }).passthrough())
    .min(1, "Flow must have at least one node"),
  edges: z.array(edgeSchema),
  startNodeId: z.string(),
  folderId: z.string().nullish(),
})
export type ImportFlowSchema = z.infer<typeof importFlowSchema>

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
      const canCreate = await userQuotaService.tryConsumeFlow(
        workspace.ownerId,
      )
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
