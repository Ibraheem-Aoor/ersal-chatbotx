import {
  billingInfoService,
  billingPlanService,
  getPaymentGateway,
} from "@chatbotx.io/business"
import { notFound, redirect } from "next/navigation"
import { env } from "@/env"
import { CheckoutWithBillingInfo } from "@/features/billing/components/checkout-with-billing-info"
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
  const editBilling = searchParams.edit === "billing"
  const billingInfo = await billingInfoService.findByUserId({
    userId: user.id,
  })

  const billingInfoData = billingInfo
    ? {
        companyName: billingInfo.companyName,
        vatNumber: billingInfo.vatNumber,
        billingEmail: billingInfo.billingEmail,
        country: billingInfo.country,
        city: billingInfo.city,
        address: billingInfo.address,
      }
    : null

  return (
    <CheckoutWithBillingInfo
      amount={Math.round(Number(plan.price) * 100)}
      billingCycle={billingCycle}
      billingInfo={editBilling ? null : billingInfoData}
      callbackUrl={`${baseUrl}/api/billing/callback`}
      currency={plan.currency}
      description={plan.name}
      editingBillingInfo={editBilling ? billingInfoData : null}
      metadata={{
        userId: user.id,
        userEmail: user.email,
        userName: user.name ?? "Customer",
        planId: plan.id,
        billingCycle,
        companyName: billingInfo?.companyName ?? "",
        billingEmail: billingInfo?.billingEmail ?? user.email,
      }}
      planId={plan.id}
      planName={plan.name}
      planPrice={plan.price}
      publishableKey={publishableKey}
    />
  )
}
