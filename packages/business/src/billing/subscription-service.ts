import { type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import { subscriptionModel } from "@chatbotx.io/database/schema"

export class SubscriptionService {
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
