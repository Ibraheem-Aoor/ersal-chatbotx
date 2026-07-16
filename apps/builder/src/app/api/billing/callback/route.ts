import {
  billingInfoService,
  billingPlanService,
  getPaymentGateway,
  paymentHistoryService,
  resolveTenantSettingsByDomain,
  subscriptionService,
  userQuotaService,
} from "@chatbotx.io/business"
import type { PaymentHistoryType } from "@chatbotx.io/database/schema"
import { sendPaymentConfirmation } from "@chatbotx.io/mail"
import { addMonths, addYears, format } from "date-fns"
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

    const paymentRecord = await paymentHistoryService.create({
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

    try {
      await sendConfirmationEmail({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        cycle: billingCycle,
        periodStart: now,
        periodEnd,
        gatewayPaymentId: paymentId,
        paymentHistoryId: paymentRecord.id,
      })
    } catch (err) {
      console.error(
        "[billing:callback] Failed to send confirmation email:",
        err,
      )
    }

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

function vatBreakdown(totalStr: string) {
  const total = Number.parseFloat(totalStr)
  const base = Math.round((total / 1.15) * 100) / 100
  const vat = Math.round((total - base) * 100) / 100
  return {
    base: base.toFixed(2),
    vat: vat.toFixed(2),
    total: total.toFixed(2),
  }
}

async function sendConfirmationEmail(props: {
  userId: string
  userEmail: string
  userName: string | null
  planName: string
  amount: string
  currency: string
  cycle: string
  periodStart: Date
  periodEnd: Date
  gatewayPaymentId: string
  paymentHistoryId: string
}) {
  const [settings, billingInfo] = await Promise.all([
    resolveTenantSettingsByDomain(null),
    billingInfoService.findByUserId({ userId: props.userId }),
  ])
  const { base, vat, total } = vatBreakdown(props.amount)
  const recipientEmail = billingInfo?.billingEmail ?? props.userEmail
  const receiptUrl = `${settings.appUrl}/billing/receipt/${props.paymentHistoryId}`

  await sendPaymentConfirmation(recipientEmail, {
    subject: `تأكيد الدفع - ${props.planName}`,
    brandName: settings.name,
    brandLogoUrl: settings.logoLightUrl,
    brandUrl: settings.appUrl,
    dir: "rtl",
    userName: props.userName ?? props.userEmail.split("@")[0] ?? "العميل",
    planName: props.planName,
    amount: props.amount,
    currency: props.currency,
    cycle: props.cycle,
    periodStart: format(props.periodStart, "dd MMM yyyy"),
    periodEnd: format(props.periodEnd, "dd MMM yyyy"),
    gatewayPaymentId: props.gatewayPaymentId,
    companyName: billingInfo?.companyName,
    vatNumber: billingInfo?.vatNumber ?? undefined,
    baseAmount: base,
    vatAmount: vat,
    totalAmount: total,
    receiptUrl,
  })
}
