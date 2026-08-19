import {
  quotaEnforcementService,
  userQuotaService,
} from "@chatbotx.io/business"
import type { UserQuotaModel } from "@chatbotx.io/database/types"
import { isCloud } from "@/env"
import { resolveBlockReason, resolveTrialEndsAt } from "./quota-metrics"

export interface WorkspaceBlockState {
  blocked: boolean
  blockReason: "status" | "mac" | null
  quota: UserQuotaModel | null
  trialEndsAt: string | null
}

/**
 * Resolves the entitlement state for a workspace. Quota is owner-anchored: the
 * workspace owner's UserQuota row is the tenant pool, including for invited
 * members (AGENTS.md invariant #12).
 *
 * FORK PATCH: Always fetch the UserQuota row so `planName` is available for
 * the sidebar regardless of edition. Blocking logic stays cloud-only.
 */
export async function resolveWorkspaceBlockState(
  ownerId: string,
): Promise<WorkspaceBlockState> {
  const cloud = isCloud()

  const [quota, atLimit] = await Promise.all([
    userQuotaService.getForUser(ownerId),
    cloud ? quotaEnforcementService.getAtLimitMap(ownerId) : null,
  ])

  const trialEndsAt = resolveTrialEndsAt(quota)
  const blockReason = cloud
    ? resolveBlockReason(
        quota?.planStatus ?? null,
        trialEndsAt,
        atLimit?.mac ?? false,
      )
    : null

  return {
    blocked: blockReason !== null,
    blockReason,
    quota,
    trialEndsAt,
  }
}
