import { billingPlanService, getPaymentGateway } from "@chatbotx.io/business"
import { notFound, redirect } from "next/navigation"
import { env } from "@/env"
import { MoyasarCheckoutForm } from "@/features/billing/components/moyasar-checkout-form"
import { getCurrentUser } from "@/lib/auth/utils"

export default async function BillingCheckoutPage(props: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) {
    return redirect("/auth/sign-in")
  }

  const searchParams = await props.searchParams
  const planId = searchParams.planId
  const billingCycle =
    (searchParams.billingCycle as "monthly" | "yearly") ?? "monthly"

  if (!planId) {
    return notFound()
  }

  const plan = await billingPlanService.findById({ id: planId })
  if (!plan?.isActive) {
    return notFound()
  }

  const gateway = getPaymentGateway()
  if (gateway.name() !== "moyasar") {
    return redirect("/pricing")
  }

  const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
  const publishableKey = process.env.MOYASAR_PUBLISHABLE_KEY ?? ""

  return (
    <MoyasarCheckoutForm
      amount={Math.round(Number(plan.price) * 100)}
      billingCycle={billingCycle}
      callbackUrl={`${baseUrl}/api/billing/callback`}
      currency={plan.currency}
      description={plan.name}
      metadata={{
        userId: user.id,
        userEmail: user.email,
        userName: user.name ?? "Customer",
        planId: plan.id,
        billingCycle,
      }}
      planName={plan.name}
      planPrice={plan.price}
      publishableKey={publishableKey}
    />
  )
}
