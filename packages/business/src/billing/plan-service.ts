import { type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import {
  type BillingCycle,
  type BillingPlanLimits,
  billingPlanModel,
} from "@chatbotx.io/database/schema"

export class BillingPlanService {
  async list(props?: { tx?: DatabaseClient; activeOnly?: boolean }) {
    const { tx = db, activeOnly = false } = props ?? {}
    const rows = await tx
      .select()
      .from(billingPlanModel)
      .orderBy(billingPlanModel.sortOrder)
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
}

export const billingPlanService = new BillingPlanService()
