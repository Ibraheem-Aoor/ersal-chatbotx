import {
  billingPlanService,
  getPaymentGateway,
  subscriptionService,
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
      return NextResponse.redirect(`${baseUrl}/pricing?error=payment_failed`)
    }

    const metadata = extractMetadata(result.rawResponse)
    const planId = metadata?.planId
    const billingCycle =
      (metadata?.billingCycle as "monthly" | "yearly") ?? "monthly"

    if (!planId) {
      return NextResponse.redirect(`${baseUrl}/pricing?error=invalid_metadata`)
    }

    const plan = await billingPlanService.findById({ id: planId })
    if (!plan) {
      return NextResponse.redirect(`${baseUrl}/pricing?error=plan_not_found`)
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

    return NextResponse.redirect(`${baseUrl}/?subscription=success`)
  } catch {
    return NextResponse.redirect(`${baseUrl}/pricing?error=callback_error`)
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
