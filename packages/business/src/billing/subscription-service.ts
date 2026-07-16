import {
  and,
  type DatabaseClient,
  db,
  desc,
  eq,
  ilike,
  type SQL,
} from "@chatbotx.io/database/client"
import type { SubscriptionStatus } from "@chatbotx.io/database/schema"
import {
  billingPlanModel,
  subscriptionModel,
  userModel,
} from "@chatbotx.io/database/schema"

export class SubscriptionService {
  listAll(props?: {
    tx?: DatabaseClient
    status?: SubscriptionStatus
    search?: string
  }) {
    const { tx = db, status, search } = props ?? {}
    const conditions: SQL[] = []
    if (status) {
      conditions.push(eq(subscriptionModel.status, status))
    }
    if (search) {
      conditions.push(ilike(userModel.email, `%${search}%`))
    }
    return tx
      .select({
        id: subscriptionModel.id,
        status: subscriptionModel.status,
        cycle: subscriptionModel.cycle,
        amount: subscriptionModel.amount,
        currency: subscriptionModel.currency,
        paymentGateway: subscriptionModel.paymentGateway,
        gatewayPaymentId: subscriptionModel.gatewayPaymentId,
        currentPeriodStart: subscriptionModel.currentPeriodStart,
        currentPeriodEnd: subscriptionModel.currentPeriodEnd,
        createdAt: subscriptionModel.createdAt,
        userName: userModel.name,
        userEmail: userModel.email,
        planName: billingPlanModel.name,
      })
      .from(subscriptionModel)
      .innerJoin(userModel, eq(subscriptionModel.userId, userModel.id))
      .innerJoin(
        billingPlanModel,
        eq(subscriptionModel.planId, billingPlanModel.id),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subscriptionModel.createdAt))
  }

  async findByUserId(props: { tx?: DatabaseClient; userId: string }) {
    const { tx = db, userId } = props
    return await tx.query.subscriptionModel.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      with: {
        plan: true,
      },
    })
  }

  async findById(props: { tx?: DatabaseClient; id: string }) {
    const { tx = db, id } = props
    return await tx.query.subscriptionModel.findFirst({
      where: { id },
      with: {
        plan: true,
        user: true,
      },
    })
  }

  async findActiveByUserId(props: { tx?: DatabaseClient; userId: string }) {
    const { tx = db, userId } = props
    return await tx.query.subscriptionModel.findFirst({
      where: {
        userId,
        status: "active",
      },
      with: {
        plan: true,
      },
    })
  }

  async createOrUpdate(props: {
    tx?: DatabaseClient
    data: {
      id?: string
      userId: string
      planId: string
      status: "active" | "trial" | "expired" | "past_due" | "cancelled"
      cycle: "monthly" | "yearly"
      amount: string
      currency: string
      paymentGateway?: string
      gatewayPaymentId?: string
      paymentToken?: string | null
      paymentTokenBrand?: string | null
      paymentTokenLastFour?: string | null
      currentPeriodStart: Date
      currentPeriodEnd: Date
    }
  }) {
    const { tx = db, data } = props
    const existing = await tx.query.subscriptionModel.findFirst({
      where: { userId: data.userId, status: "active" },
    })

    if (existing) {
      const [row] = await tx
        .update(subscriptionModel)
        .set({
          planId: data.planId,
          status: data.status,
          cycle: data.cycle,
          amount: data.amount,
          currency: data.currency,
          paymentGateway: data.paymentGateway,
          gatewayPaymentId: data.gatewayPaymentId,
          paymentToken: data.paymentToken ?? existing.paymentToken,
          paymentTokenBrand:
            data.paymentTokenBrand ?? existing.paymentTokenBrand,
          paymentTokenLastFour:
            data.paymentTokenLastFour ?? existing.paymentTokenLastFour,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
        })
        .where(eq(subscriptionModel.id, existing.id))
        .returning()
      return row
    }

    const [row] = await tx.insert(subscriptionModel).values(data).returning()
    return row
  }
}

export const subscriptionService = new SubscriptionService()
