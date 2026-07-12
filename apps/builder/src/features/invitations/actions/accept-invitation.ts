"use server"

import {
  quotaEnforcementService,
  workspaceService,
} from "@chatbotx.io/business"
import { ChatbotXException } from "@chatbotx.io/business/errors"
import { db, findOrFail } from "@chatbotx.io/database/client"
import {
  invitationModel,
  workspaceMemberModel,
} from "@chatbotx.io/database/schema"
import { invalidateCacheByTags } from "@chatbotx.io/redis"
import { createId } from "@chatbotx.io/utils"
import { getTranslations } from "next-intl/server"
import { z } from "zod"
import { authActionClient } from "@/lib/safe-action"

export const acceptInvitationAction = authActionClient
  .inputSchema(
    z.object({
      code: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { code } = parsedInput
    const t = await getTranslations("billing.errors")

    const invitation = await findOrFail({
      table: invitationModel,
      where: {
        code,
      },
      message: "Invitation not found",
    })

    if (invitation.expiresAt < new Date()) {
      throw new ChatbotXException(t("invitationExpired"))
    }

    if (!invitation.workspaceId) {
      throw new ChatbotXException(t("invalidInvitation"))
    }

    const existingMember = await db.query.workspaceMemberModel.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId: ctx.user.id,
      },
    })
    if (existingMember) {
      throw new ChatbotXException(t("alreadyMember"))
    }

    const workspace = await workspaceService.find({
      where: { id: invitation.workspaceId },
    })
    if (workspace) {
      const consumed = await quotaEnforcementService.tryConsume({
        userId: workspace.ownerId,
        metric: "teamMembers",
      })
      if (!consumed.ok) {
        throw new ChatbotXException(t("teamMemberLimitReached"))
      }
    }

    await db.insert(workspaceMemberModel).values({
      id: createId(),
      workspaceId: invitation.workspaceId,
      userId: ctx.user.id,
      role: "agent",
      permissions: invitation.permissions,
      notificationTypes: {
        notifyAdmin: true,
        newMessageToHuman: true,
        newOrder: true,
      },
      notificationChannels: {
        messenger: true,
        email: true,
        telegram: true,
        browser: true,
      },
    })

    // The new membership must show up in the invitee's cached workspace list
    // right away; bust the tag so the workspace becomes reachable immediately.
    // Also bust the workspace-side member list so existing admins see the new
    // member without waiting for that cache's TTL to expire.
    await invalidateCacheByTags([
      `users:${ctx.user.id}:workspace-members`,
      `workspaces:${invitation.workspaceId}:workspace-members`,
    ])
  })
