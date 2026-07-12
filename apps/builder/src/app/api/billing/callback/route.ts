import {
  billingPlanService,
  getPaymentGateway,
  subscriptionService,
  userQuotaService,
} from "@chatbotx.io/business"
import { addMonths, addYears } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"
import { getCurrentUser } from "@/lib/auth/utils"

export async function GET(req: NextRequest) {
  const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
  const paymentId = req.nextUrl.searchParams.get("paymentId")

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

    await subscriptionService.createOrUpdate({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "active",
        cycle: billingCycle,
        amount: plan.price,
        currency: plan.currency,
        paymentGateway: gateway.name(),
        gatewayPaymentId: paymentId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
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

function extractMetadata(
  rawResponse: Record<string, unknown>,
): Record<string, string> | null {
  try {
    const udf = (rawResponse as Record<string, Record<string, string>>).Data
      ?.UserDefinedField
    if (typeof udf === "string") {
      return JSON.parse(udf)
    }
    return null
  } catch {
    return null
  }
}
