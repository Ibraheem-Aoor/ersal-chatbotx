"use server"

import { workspaceService } from "@chatbotx.io/business"
import { z } from "zod"
import { authActionClient } from "@/lib/safe-action"

const createWorkspaceInput = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().default("UTC"),
})

export const createWorkspaceAction = authActionClient
  .inputSchema(createWorkspaceInput)
  .action(async ({ parsedInput, ctx }) => {
    const workspace = await workspaceService.create({
      createdBy: ctx.user.id,
      data: {
        name: parsedInput.name,
        timezone: parsedInput.timezone,
        ownerId: ctx.user.id,
      },
    })

    return { workspaceId: workspace.id }
  })
