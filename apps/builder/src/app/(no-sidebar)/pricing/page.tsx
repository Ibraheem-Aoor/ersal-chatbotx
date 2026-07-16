import {
  billingPlanService,
  getPaymentGateway,
  subscriptionService,
} from "@chatbotx.io/business"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PricingCards } from "@/features/billing/components/pricing-cards"
import { getCurrentUser } from "@/lib/auth/utils"

export default async function PricingPage() {
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const [plans, subscription] = await Promise.all([
    billingPlanService.list({ activeOnly: true }),
    subscriptionService.findByUserId({ userId: user.id }),
  ])

  const isActiveSub = subscription?.status === "active"
  const isTrial = subscription?.status === "trial"
  const trialDaysLeft =
    isTrial && subscription.currentPeriodEnd
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="text-center">
        <Link
          className="text-muted-foreground text-sm hover:underline"
          href="/"
        >
          {t("actions.back")}
        </Link>
        <h1 className="font-bold text-3xl">{t("plans.pricingTitle")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("plans.pricingDescription")}
        </p>
        {isTrial && trialDaysLeft !== null && (
          <p className="mt-2 font-medium text-amber-600">
            {t("billing.trial.daysLeft", { days: trialDaysLeft })}
          </p>
        )}
      </div>

      <PricingCards
        currentPlanId={isActiveSub ? subscription.planId : undefined}
        gatewayType={getPaymentGateway().name()}
        plans={plans}
      />
    </div>
  )
}
