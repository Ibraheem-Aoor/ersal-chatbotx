import {
  and,
  type DatabaseClient,
  db,
  desc,
  eq,
  ilike,
  type SQL,
} from "@chatbotx.io/database/client"
import type {
  PaymentHistoryStatus,
  PaymentHistoryType,
} from "@chatbotx.io/database/schema"
import { paymentHistoryModel, userModel } from "@chatbotx.io/database/schema"

export class PaymentHistoryService {
  async create(props: {
    tx?: DatabaseClient
    data: {
      userId: string
      subscriptionId?: string | null
      planId: string
      planName: string
      amount: string
      currency: string
      paymentGateway: string
      gatewayPaymentId: string
      type: PaymentHistoryType
      status: PaymentHistoryStatus
      metadata?: Record<string, unknown> | null
    }
  }) {
    const { tx = db, data } = props
    const [row] = await tx.insert(paymentHistoryModel).values(data).returning()
    return row
  }

  listByUserId(props: { tx?: DatabaseClient; userId: string }) {
    const { tx = db, userId } = props
    return tx.query.paymentHistoryModel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  listBySubscriptionId(props: { tx?: DatabaseClient; subscriptionId: string }) {
    const { tx = db, subscriptionId } = props
    return tx.query.paymentHistoryModel.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: "desc" },
    })
  }

  listAll(props?: {
    tx?: DatabaseClient
    type?: PaymentHistoryType
    search?: string
  }) {
    const { tx = db, type, search } = props ?? {}
    const conditions: SQL[] = []
    if (type) {
      conditions.push(eq(paymentHistoryModel.type, type))
    }
    if (search) {
      conditions.push(ilike(userModel.email, `%${search}%`))
    }
    return tx
      .select({
        id: paymentHistoryModel.id,
        createdAt: paymentHistoryModel.createdAt,
        userId: paymentHistoryModel.userId,
        subscriptionId: paymentHistoryModel.subscriptionId,
        planName: paymentHistoryModel.planName,
        amount: paymentHistoryModel.amount,
        currency: paymentHistoryModel.currency,
        type: paymentHistoryModel.type,
        status: paymentHistoryModel.status,
        paymentGateway: paymentHistoryModel.paymentGateway,
        gatewayPaymentId: paymentHistoryModel.gatewayPaymentId,
        userEmail: userModel.email,
        userName: userModel.name,
      })
      .from(paymentHistoryModel)
      .innerJoin(userModel, eq(paymentHistoryModel.userId, userModel.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentHistoryModel.createdAt))
  }
}

export const paymentHistoryService = new PaymentHistoryService()
