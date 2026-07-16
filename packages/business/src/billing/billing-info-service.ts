import { type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import { billingInfoModel } from "@chatbotx.io/database/schema"

export class BillingInfoService {
  async findByUserId(props: { tx?: DatabaseClient; userId: string }) {
    const { tx = db, userId } = props
    const [row] = await tx
      .select()
      .from(billingInfoModel)
      .where(eq(billingInfoModel.userId, userId))
    return row ?? null
  }

  async createOrUpdate(props: {
    tx?: DatabaseClient
    userId: string
    data: {
      companyName: string
      vatNumber?: string | null
      billingEmail: string
      country?: string
      city?: string | null
      address?: string | null
    }
  }) {
    const { tx = db, userId, data } = props
    const existing = await this.findByUserId({ tx, userId })

    if (existing) {
      const [row] = await tx
        .update(billingInfoModel)
        .set(data)
        .where(eq(billingInfoModel.id, existing.id))
        .returning()
      return row
    }

    const [row] = await tx
      .insert(billingInfoModel)
      .values({ userId, ...data })
      .returning()
    return row
  }
}

export const billingInfoService = new BillingInfoService()
