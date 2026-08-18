"use server"

import { flowService, flowVersionService } from "@chatbotx.io/business"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { workspaceActionClient } from "@/lib/safe-action"

const EXPORT_VERSION = 1

export const exportFlowAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString(), zodBigintAsString()])
  .action(async ({ bindArgsParsedInputs: [workspaceId, flowId] }) => {
    const flow = await flowService.findBy({ workspaceId, id: flowId })
    if (!flow) {
      throw new Error("Flow not found")
    }

    const draftVersion = await flowVersionService.findDraft({
      flowId: flow.id,
      workspaceId,
    })
    if (!draftVersion) {
      throw new Error("Draft version not found")
    }

    return {
      version: EXPORT_VERSION,
      name: flow.name,
      active: flow.active,
      enableInInbox: flow.enableInInbox,
      nodes: draftVersion.nodes,
      edges: draftVersion.edges,
      startNodeId: draftVersion.startNodeId,
      exportedAt: new Date().toISOString(),
    }
  })
