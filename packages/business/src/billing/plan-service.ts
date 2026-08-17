import {
  type DatabaseClient,
  and,
  db,
  desc,
  eq,
  inArray,
} from "@chatbotx.io/database/client"
import {
  type BillingCycle,
  type BillingPlanLimits,
  billingPlanModel,
  subscriptionModel,
} from "@chatbotx.io/database/schema"
import { userQuotaService } from "../user-quota/service"
import { logger } from "../logger"

export class BillingPlanService {
  async list(props?: { tx?: DatabaseClient; activeOnly?: boolean }) {
    const { tx = db, activeOnly = false } = props ?? {}
    const rows = await tx
      .select()
      .from(billingPlanModel)
      .orderBy(desc(billingPlanModel.createdAt))
    if (activeOnly) {
      return rows.filter((r) => r.isActive)
    }
    return rows
  }

  async findById(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    const [row] = await tx
      .select()
      .from(billingPlanModel)
      .where(eq(billingPlanModel.id, id))
    return row ?? null
  }

  async findDefault(props?: { tx?: DatabaseClient }) {
    const { tx = db } = props ?? {}
    const [row] = await tx
      .select()
      .from(billingPlanModel)
      .where(eq(billingPlanModel.isDefault, true))
      .limit(1)
    return row ?? null
  }

  async setDefault(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    await tx
      .update(billingPlanModel)
      .set({ isDefault: false })
      .where(eq(billingPlanModel.isDefault, true))
    const [row] = await tx
      .update(billingPlanModel)
      .set({ isDefault: true })
      .where(eq(billingPlanModel.id, id))
      .returning()
    return row
  }

  async create(props: {
    tx?: DatabaseClient
    data: {
      name: string
      description?: string
      price: string
      currency?: string
      billingCycle?: BillingCycle
      limits: BillingPlanLimits
      features: string[]
      isActive?: boolean
      isDefault?: boolean
      trialDays?: number | null
      sortOrder?: number
    }
  }) {
    const { tx = db, data } = props
    const [row] = await tx
      .insert(billingPlanModel)
      .values({
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency ?? "SAR",
        billingCycle: data.billingCycle ?? "monthly",
        limits: data.limits,
        features: data.features,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        trialDays: data.trialDays ?? null,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning()
    return row
  }

  async update(props: {
    tx?: DatabaseClient
    id: string
    data: {
      name?: string
      description?: string
      price?: string
      currency?: string
      billingCycle?: BillingCycle
      limits?: BillingPlanLimits
      features?: string[]
      isActive?: boolean
      isDefault?: boolean
      trialDays?: number | null
      sortOrder?: number
    }
  }) {
    const { tx = db, id, data } = props
    const [row] = await tx
      .update(billingPlanModel)
      .set(data)
      .where(eq(billingPlanModel.id, id))
      .returning()
    return row
  }

  async delete(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    await tx.delete(billingPlanModel).where(eq(billingPlanModel.id, id))
  }

  /**
   * Re-apply a plan's limits to every active/trial subscriber on that plan.
   * Fixes the "stale limits" bug: when an admin edits a plan's limits, existing
   * users keep the old values until this propagation runs. Direct DB writes —
   * no portal or queue dependency, suitable for our self-hosted scale.
   */
  async propagatePlanLimits(props: {
    tx?: DatabaseClient
    planId: string
  }): Promise<number> {
    const { tx = db, planId } = props
    const plan = await this.findById({ tx, id: planId })
    if (!plan) {
      return 0
    }

    const subscribers = await tx
      .select({
        userId: subscriptionModel.userId,
        currentPeriodStart: subscriptionModel.currentPeriodStart,
        currentPeriodEnd: subscriptionModel.currentPeriodEnd,
      })
      .from(subscriptionModel)
      .where(
        and(
          eq(subscriptionModel.planId, planId),
          inArray(subscriptionModel.status, ["active", "trial"]),
        ),
      )

    let updated = 0
    for (const sub of subscribers) {
      try {
        await userQuotaService.applyPlanEntitlements({
          userId: sub.userId,
          planName: plan.name,
          contactsLimit: plan.limits.contacts,
          macLimit: plan.limits.mac,
          workspacesLimit: plan.limits.workspaces,
          channelsLimit: plan.limits.channels,
          teamMembersLimit: plan.limits.teamMembers,
          flowsLimit: plan.limits.flows,
          broadcastsLimit: plan.limits.broadcasts,
          aiAgentsEnabled: plan.limits.aiAgents,
          periodStart: sub.currentPeriodStart,
          periodEnd: sub.currentPeriodEnd,
        })
        updated++
      } catch (err) {
        logger.error(
          { err, userId: sub.userId, planId },
          "billing: failed to propagate plan limits to user",
        )
      }
    }

    return updated
  }
}

export const billingPlanService = new BillingPlanService()
