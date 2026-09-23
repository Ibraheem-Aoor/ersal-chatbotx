"use server"

import {
  type WorkspaceIdAndIdRequestParams,
  workspaceIdAndIdRequestParams,
} from "@/features/common/schemas"
import { whatsappFlowService } from "@/features/integration-whatsapp/flows/queries"
import { workspaceActionClient } from "@/lib/safe-action"

export const listWhatsappFlowsForTemplateAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdAndIdRequestParams)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId, integrationWhatsappId],
    }: {
      bindArgsParsedInputs: WorkspaceIdAndIdRequestParams
    }) => {
      const flows = await whatsappFlowService.list({
        where: { workspaceId, integrationWhatsappId },
      })

      return flows.map((f) => ({
        sourceId: f.sourceId,
        name: f.name,
        status: f.status,
      }))
    },
  )
