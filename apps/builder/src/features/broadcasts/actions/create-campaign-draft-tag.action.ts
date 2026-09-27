"use server"

import { tagService, tagSyncService } from "@chatbotx.io/business"
import { createId } from "@chatbotx.io/utils"
import { workspaceIdrequestParams } from "@/features/common/schemas"
import { workspaceActionClient } from "@/lib/safe-action"

export const createCampaignDraftTagAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .action(async ({ bindArgsParsedInputs: [workspaceId] }) => {
    const draftId = createId()
    const tagName = `campaign-draft-${draftId}`

    const [tag] = await tagService.upsertByNames({
      workspaceId,
      names: [tagName],
    })

    if (tag) {
      await tagSyncService.enqueueCreate({
        workspaceId,
        tagId: tag.id,
      })
    }

    return { id: tag.id, name: tag.name }
  })
