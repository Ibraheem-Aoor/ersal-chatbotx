import { billingPlanService, getPaymentGateway } from "@chatbotx.io/business"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"
import { getCurrentUser } from "@/lib/auth/utils"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { planId, billingCycle } = body

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    const plan = await billingPlanService.findById({ id: planId })
    if (!plan?.isActive) {
      return NextResponse.json(
        { error: "Plan not found or inactive" },
        { status: 404 },
      )
    }

    const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
    const gateway = getPaymentGateway()

    const initiation = await gateway.initiate({
      amount: Number(plan.price),
      currency: plan.currency,
      description: plan.name,
      callbackUrl: `${baseUrl}/api/billing/callback`,
      errorUrl: `${baseUrl}/pricing?error=payment_failed`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name ?? "Customer",
        planId: plan.id,
        billingCycle: billingCycle ?? "monthly",
      },
    })

    return NextResponse.json({
      redirectUrl: initiation.redirectUrl,
      paymentId: initiation.paymentId,
      type: initiation.type,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
