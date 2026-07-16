import {
  billingPlanService,
  getPaymentGateway,
  paymentHistoryService,
  subscriptionService,
  userQuotaService,
} from "@chatbotx.io/business"
import type { PaymentHistoryType } from "@chatbotx.io/database/schema"
import { addMonths, addYears } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"
import { getCurrentUser } from "@/lib/auth/utils"

export async function GET(req: NextRequest) {
  const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
  const paymentId =
    req.nextUrl.searchParams.get("paymentId") ??
    req.nextUrl.searchParams.get("id")

  if (!paymentId) {
    return NextResponse.redirect(`${baseUrl}/pricing?error=missing_payment_id`)
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/auth/sign-in`)
    }

    const gateway = getPaymentGateway()
    const result = await gateway.verify(paymentId)

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/billing/error?reason=payment_failed`,
      )
    }

    const metadata = extractMetadata(result.rawResponse)
    const planId = metadata?.planId
    const billingCycle =
      (metadata?.billingCycle as "monthly" | "yearly") ?? "monthly"

    if (!planId) {
      return NextResponse.redirect(
        `${baseUrl}/billing/error?reason=invalid_metadata`,
      )
    }

    const plan = await billingPlanService.findById({ id: planId })
    if (!plan) {
      return NextResponse.redirect(
        `${baseUrl}/billing/error?reason=plan_not_found`,
      )
    }

    const now = new Date()
    const periodEnd =
      billingCycle === "yearly" ? addYears(now, 1) : addMonths(now, 1)

    const existing = await subscriptionService.findActiveByUserId({
      userId: user.id,
    })
    let paymentType: PaymentHistoryType = "new"
    if (existing) {
      if (existing.planId === plan.id) {
        paymentType = "renewal"
      } else {
        const currentPrice = Number.parseFloat(existing.amount)
        const newPrice = Number.parseFloat(plan.price)
        paymentType = newPrice > currentPrice ? "upgrade" : "downgrade"
      }
    }

    const tokenData = extractTokenData(result.rawResponse)

    const subscription = await subscriptionService.createOrUpdate({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "active",
        cycle: billingCycle,
        amount: plan.price,
        currency: plan.currency,
        paymentGateway: gateway.name(),
        gatewayPaymentId: paymentId,
        paymentToken: tokenData?.token ?? null,
        paymentTokenBrand: tokenData?.brand ?? null,
        paymentTokenLastFour: tokenData?.lastFour ?? null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })

    await paymentHistoryService.create({
      data: {
        userId: user.id,
        subscriptionId: subscription?.id ?? null,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        paymentGateway: gateway.name(),
        gatewayPaymentId: paymentId,
        type: paymentType,
        status: "paid",
        metadata: result.rawResponse,
      },
    })

    await userQuotaService.applyPlanEntitlements({
      userId: user.id,
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

    const params = new URLSearchParams({
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      cycle: billingCycle,
      periodStart: now.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })

    return NextResponse.redirect(
      `${baseUrl}/billing/success?${params.toString()}`,
    )
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/billing/error?reason=callback_error`,
    )
  }
}

function extractTokenData(
  rawResponse: Record<string, unknown>,
): { token: string; brand?: string; lastFour?: string } | null {
  try {
    const source = rawResponse.source as Record<string, unknown> | undefined
    if (!source?.token || typeof source.token !== "string") {
      return null
    }
    return {
      token: source.token,
      brand: typeof source.company === "string" ? source.company : undefined,
      lastFour: typeof source.number === "string" ? source.number : undefined,
    }
  } catch {
    return null
  }
}

function extractMetadata(
  rawResponse: Record<string, unknown>,
): Record<string, string> | null {
  try {
    const udf = (rawResponse as Record<string, Record<string, string>>).Data
      ?.UserDefinedField
    if (typeof udf === "string") {
      return JSON.parse(udf)
    }

    const moyasarMeta = rawResponse.metadata
    if (moyasarMeta && typeof moyasarMeta === "object") {
      return moyasarMeta as Record<string, string>
    }

    return null
  } catch {
    return null
  }
}
