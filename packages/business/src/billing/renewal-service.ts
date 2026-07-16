import { and, db, eq, isNotNull, lte, or } from "@chatbotx.io/database/client"
import {
  billingPlanModel,
  subscriptionModel,
  userModel,
} from "@chatbotx.io/database/schema"
import { userQuotaService } from "../user-quota"
import { getPaymentGateway } from "./payment-gateway-factory"
import { paymentHistoryService } from "./payment-history-service"

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

export class RenewalService {
  async findDueForRenewal(daysBeforeExpiry = 0) {
    const cutoff = addDays(new Date(), daysBeforeExpiry)
    return await db
      .select({
        id: subscriptionModel.id,
        userId: subscriptionModel.userId,
        planId: subscriptionModel.planId,
        status: subscriptionModel.status,
        cycle: subscriptionModel.cycle,
        amount: subscriptionModel.amount,
        currency: subscriptionModel.currency,
        paymentGateway: subscriptionModel.paymentGateway,
        paymentToken: subscriptionModel.paymentToken,
        paymentTokenBrand: subscriptionModel.paymentTokenBrand,
        paymentTokenLastFour: subscriptionModel.paymentTokenLastFour,
        currentPeriodStart: subscriptionModel.currentPeriodStart,
        currentPeriodEnd: subscriptionModel.currentPeriodEnd,
        planName: billingPlanModel.name,
        planPrice: billingPlanModel.price,
        planCurrency: billingPlanModel.currency,
        planLimits: billingPlanModel.limits,
        userEmail: userModel.email,
        userName: userModel.name,
      })
      .from(subscriptionModel)
      .innerJoin(
        billingPlanModel,
        eq(subscriptionModel.planId, billingPlanModel.id),
      )
      .innerJoin(userModel, eq(subscriptionModel.userId, userModel.id))
      .where(
        and(
          eq(subscriptionModel.status, "active"),
          isNotNull(subscriptionModel.paymentToken),
          lte(subscriptionModel.currentPeriodEnd, cutoff),
        ),
      )
  }

  async findExpiredPastDue(graceDays = 3) {
    const cutoff = addDays(new Date(), -graceDays)
    return await db
      .select({
        id: subscriptionModel.id,
        userId: subscriptionModel.userId,
        planId: subscriptionModel.planId,
        currentPeriodEnd: subscriptionModel.currentPeriodEnd,
        planName: billingPlanModel.name,
        userEmail: userModel.email,
        userName: userModel.name,
      })
      .from(subscriptionModel)
      .innerJoin(
        billingPlanModel,
        eq(subscriptionModel.planId, billingPlanModel.id),
      )
      .innerJoin(userModel, eq(subscriptionModel.userId, userModel.id))
      .where(
        and(
          eq(subscriptionModel.status, "past_due"),
          lte(subscriptionModel.currentPeriodEnd, cutoff),
        ),
      )
  }

  async findExpiringIn(days: number) {
    const now = new Date()
    const cutoff = addDays(now, days)
    return await db
      .select({
        id: subscriptionModel.id,
        userId: subscriptionModel.userId,
        planId: subscriptionModel.planId,
        status: subscriptionModel.status,
        cycle: subscriptionModel.cycle,
        amount: subscriptionModel.amount,
        currency: subscriptionModel.currency,
        paymentToken: subscriptionModel.paymentToken,
        currentPeriodEnd: subscriptionModel.currentPeriodEnd,
        planName: billingPlanModel.name,
        userEmail: userModel.email,
        userName: userModel.name,
      })
      .from(subscriptionModel)
      .innerJoin(
        billingPlanModel,
        eq(subscriptionModel.planId, billingPlanModel.id),
      )
      .innerJoin(userModel, eq(subscriptionModel.userId, userModel.id))
      .where(
        and(
          or(
            eq(subscriptionModel.status, "active"),
            eq(subscriptionModel.status, "trial"),
          ),
          lte(subscriptionModel.currentPeriodEnd, cutoff),
        ),
      )
  }

  async renewSubscription(sub: {
    id: string
    userId: string
    planId: string
    cycle: "monthly" | "yearly"
    amount: string
    currency: string
    paymentToken: string | null
    planName: string
    planPrice: string
    planCurrency: string
    planLimits: {
      contacts: number
      mac: number
      workspaces: number
      channels: number
      teamMembers: number
      flows: number
      broadcasts: number
      aiAgents: boolean
    }
  }): Promise<
    | {
        success: true
        paymentHistoryId: string
        gatewayPaymentId: string
        periodStart: Date
        periodEnd: Date
      }
    | { success: false; error: string }
  > {
    if (!sub.paymentToken) {
      return { success: false, error: "No saved payment token" }
    }

    const gateway = getPaymentGateway()
    if (!gateway.chargeToken) {
      return { success: false, error: "Gateway does not support token charges" }
    }

    const chargeResult = await gateway.chargeToken({
      token: sub.paymentToken,
      amount: Number(sub.planPrice),
      currency: sub.planCurrency,
      description: `Renewal: ${sub.planName}`,
      metadata: {
        subscriptionId: sub.id,
        userId: sub.userId,
        type: "renewal",
      },
    })

    const now = new Date()

    if (chargeResult.success) {
      const periodEnd =
        sub.cycle === "yearly" ? addYears(now, 1) : addMonths(now, 1)

      await db
        .update(subscriptionModel)
        .set({
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gatewayPaymentId: chargeResult.paymentId,
        })
        .where(eq(subscriptionModel.id, sub.id))

      const paymentRecord = await paymentHistoryService.create({
        data: {
          userId: sub.userId,
          subscriptionId: sub.id,
          planId: sub.planId,
          planName: sub.planName,
          amount: sub.planPrice,
          currency: sub.planCurrency,
          paymentGateway: gateway.name(),
          gatewayPaymentId: chargeResult.paymentId,
          type: "renewal",
          status: "paid",
        },
      })

      await userQuotaService.applyPlanEntitlements({
        userId: sub.userId,
        planName: sub.planName,
        contactsLimit: sub.planLimits.contacts,
        macLimit: sub.planLimits.mac,
        workspacesLimit: sub.planLimits.workspaces,
        channelsLimit: sub.planLimits.channels,
        teamMembersLimit: sub.planLimits.teamMembers,
        flowsLimit: sub.planLimits.flows,
        broadcastsLimit: sub.planLimits.broadcasts,
        aiAgentsEnabled: sub.planLimits.aiAgents,
        periodStart: now,
        periodEnd,
      })

      return {
        success: true,
        paymentHistoryId: paymentRecord.id,
        gatewayPaymentId: chargeResult.paymentId,
        periodStart: now,
        periodEnd,
      }
    }

    await db
      .update(subscriptionModel)
      .set({ status: "past_due" })
      .where(eq(subscriptionModel.id, sub.id))

    await paymentHistoryService.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        planId: sub.planId,
        planName: sub.planName,
        amount: sub.planPrice,
        currency: sub.planCurrency,
        paymentGateway: gateway.name(),
        gatewayPaymentId: chargeResult.paymentId || "failed",
        type: "renewal",
        status: "failed",
        metadata: { error: chargeResult.errorMessage },
      },
    })

    return {
      success: false,
      error: chargeResult.errorMessage ?? "Payment failed",
    }
  }

  async processRenewals(): Promise<{ renewed: number; failed: number }> {
    const due = await this.findDueForRenewal(0)
    let renewed = 0
    let failed = 0

    for (const sub of due) {
      if (!sub.paymentToken) {
        continue
      }
      const result = await this.renewSubscription({
        id: sub.id,
        userId: sub.userId,
        planId: sub.planId,
        cycle: sub.cycle,
        amount: sub.amount,
        currency: sub.currency,
        paymentToken: sub.paymentToken,
        planName: sub.planName,
        planPrice: sub.planPrice,
        planCurrency: sub.planCurrency,
        planLimits: sub.planLimits,
      })
      if (result.success) {
        renewed++
      } else {
        failed++
      }
    }

    return { renewed, failed }
  }

  async expirePastDue(graceDays = 3) {
    const overdue = await this.findExpiredPastDue(graceDays)
    const expiredSubs: {
      userId: string
      userEmail: string
      userName: string | null
      planName: string
    }[] = []

    for (const sub of overdue) {
      await db
        .update(subscriptionModel)
        .set({ status: "expired" })
        .where(eq(subscriptionModel.id, sub.id))

      await userQuotaService.applyPlanEntitlements({
        userId: sub.userId,
        planName: "Free",
        contactsLimit: 100,
        macLimit: 50,
        workspacesLimit: 1,
        channelsLimit: 1,
        teamMembersLimit: 1,
        flowsLimit: 3,
        broadcastsLimit: 1,
        aiAgentsEnabled: false,
        periodStart: new Date(),
        periodEnd: addYears(new Date(), 99),
      })

      expiredSubs.push({
        userId: sub.userId,
        userEmail: sub.userEmail,
        userName: sub.userName,
        planName: sub.planName,
      })
    }

    return { expired: expiredSubs.length, expiredSubs }
  }
}

export const renewalService = new RenewalService()
