import {
  and,
  count,
  type DatabaseClient,
  db,
  desc,
  eq,
  ilike,
  max,
  ne,
  or,
  type SQL,
} from "@chatbotx.io/database/client"
import {
  billingPlanModel,
  subscriptionModel,
  userModel,
  workspaceMemberModel,
} from "@chatbotx.io/database/schema"
import { keys } from "../keys"
import { userQuotaService } from "../user-quota"

export type UserAccountStatus = "active" | "suspended" | "banned"

export class UserAdminService {
  listAll(props?: { tx?: DatabaseClient; search?: string }) {
    const { tx = db, search } = props ?? {}
    const conditions: SQL[] = []

    const { PLATFORM_ADMIN_EMAIL } = keys()
    if (PLATFORM_ADMIN_EMAIL) {
      conditions.push(ne(userModel.email, PLATFORM_ADMIN_EMAIL))
    }

    if (search) {
      const searchCondition = or(
        ilike(userModel.email, `%${search}%`),
        ilike(userModel.name, `%${search}%`),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const latestSub = tx
      .select({
        userId: subscriptionModel.userId,
        maxId: max(subscriptionModel.id).as("max_id"),
      })
      .from(subscriptionModel)
      .groupBy(subscriptionModel.userId)
      .as("latest_sub")

    return tx
      .select({
        id: userModel.id,
        name: userModel.name,
        email: userModel.email,
        emailVerified: userModel.emailVerified,
        image: userModel.image,
        createdAt: userModel.createdAt,
        tenantId: userModel.tenantId,
        status: userModel.status,
        subscriptionStatus: subscriptionModel.status,
        planName: billingPlanModel.name,
      })
      .from(userModel)
      .leftJoin(latestSub, eq(userModel.id, latestSub.userId))
      .leftJoin(subscriptionModel, eq(latestSub.maxId, subscriptionModel.id))
      .leftJoin(
        billingPlanModel,
        eq(subscriptionModel.planId, billingPlanModel.id),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userModel.createdAt))
  }

  async findById(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    const user = await tx.query.userModel.findFirst({
      where: { id },
    })
    if (!user) {
      return null
    }

    const subscription = await tx.query.subscriptionModel.findFirst({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      with: { plan: true },
    })

    const workspaces = await tx
      .select({
        id: workspaceMemberModel.workspaceId,
        role: workspaceMemberModel.role,
      })
      .from(workspaceMemberModel)
      .where(eq(workspaceMemberModel.userId, id))

    return { user, subscription, workspaces }
  }

  async getWorkspaceCount(props: { tx?: DatabaseClient; userId: string }) {
    const { tx = db, userId } = props
    const [result] = await tx
      .select({ count: count() })
      .from(workspaceMemberModel)
      .where(eq(workspaceMemberModel.userId, userId))
    return result?.count ?? 0
  }

  async deleteUser(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    await tx.delete(userModel).where(eq(userModel.id, id))
  }

  async toggleVerification(props: {
    tx?: DatabaseClient
    id: string
    verified: boolean
  }) {
    const { tx = db, id, verified } = props
    const [updated] = await tx
      .update(userModel)
      .set({ emailVerified: verified })
      .where(eq(userModel.id, id))
      .returning()
    return updated
  }

  async setStatus(props: {
    tx?: DatabaseClient
    id: string
    status: UserAccountStatus
  }) {
    const { tx = db, id, status } = props
    const [updated] = await tx
      .update(userModel)
      .set({ status })
      .where(eq(userModel.id, id))
      .returning()
    return updated
  }

  async changePlan(props: {
    tx?: DatabaseClient
    userId: string
    planId: string
  }) {
    const { tx = db, userId, planId } = props

    const [plan] = await tx
      .select()
      .from(billingPlanModel)
      .where(eq(billingPlanModel.id, planId))
    if (!plan) {
      return { success: false as const, error: "Plan not found" }
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (plan.billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    const existing = await tx.query.subscriptionModel.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    if (existing) {
      await tx
        .update(subscriptionModel)
        .set({
          planId,
          status: "active",
          amount: plan.price,
          currency: plan.currency,
          cycle: plan.billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
        .where(eq(subscriptionModel.id, existing.id))
    } else {
      await tx.insert(subscriptionModel).values({
        userId,
        planId,
        status: "active",
        cycle: plan.billingCycle,
        amount: plan.price,
        currency: plan.currency,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      })
    }

    await userQuotaService.applyPlanEntitlements({
      userId,
      planName: plan.name,
      contactsLimit: plan.limits.contacts,
      macLimit: plan.limits.mac,
      workspacesLimit: plan.limits.workspaces,
      channelsLimit: plan.limits.channels,
      teamMembersLimit: plan.limits.teamMembers,
      flowsLimit: plan.limits.flows,
      broadcastsLimit: plan.limits.broadcasts,
      aiAgentsEnabled: plan.limits.aiAgents,
      periodStart: now,
      periodEnd,
    })

    return { success: true as const, planName: plan.name }
  }
}

export const userAdminService = new UserAdminService()
