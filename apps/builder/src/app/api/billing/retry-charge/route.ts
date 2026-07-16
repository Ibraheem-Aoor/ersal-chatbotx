import { renewalService, subscriptionService } from "@chatbotx.io/business"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/utils"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscription = await subscriptionService.findByUserId({
    userId: user.id,
  })
  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 },
    )
  }

  if (subscription.status !== "past_due") {
    return NextResponse.json(
      { error: "Subscription is not past due" },
      { status: 400 },
    )
  }

  if (!subscription.paymentToken) {
    return NextResponse.json(
      { error: "No saved payment method" },
      { status: 400 },
    )
  }

  const plan = subscription.plan
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  const result = await renewalService.renewSubscription({
    id: subscription.id,
    userId: subscription.userId,
    planId: subscription.planId,
    cycle: subscription.cycle,
    amount: subscription.amount,
    currency: subscription.currency,
    paymentToken: subscription.paymentToken,
    planName: plan.name,
    planPrice: plan.price,
    planCurrency: plan.currency,
    planLimits: plan.limits,
  })

  if (result.success) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { error: result.error ?? "Payment failed" },
    { status: 402 },
  )
}
