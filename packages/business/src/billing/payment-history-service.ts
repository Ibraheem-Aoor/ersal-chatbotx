import { type DatabaseClient, db } from "@chatbotx.io/database/client"
import type {
  PaymentHistoryStatus,
  PaymentHistoryType,
} from "@chatbotx.io/database/schema"
import { paymentHistoryModel } from "@chatbotx.io/database/schema"

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
}

export const paymentHistoryService = new PaymentHistoryService()
