import { subscriptionService } from "@chatbotx.io/business"
import { BillingBanner } from "./billing-banner"

export async function BillingBannerServer({ userId }: { userId: string }) {
  const sub = await subscriptionService.findByUserId({ userId })
  if (!sub) {
    return null
  }

  const now = new Date()

  if (sub.status === "expired") {
    return <BillingBanner status="expired" />
  }

  if (sub.status === "past_due") {
    const msPerDay = 86_400_000
    const daysSinceExpiry = Math.max(
      0,
      Math.ceil(
        (now.getTime() - new Date(sub.currentPeriodEnd).getTime()) / msPerDay,
      ),
    )
    const daysLeft = Math.max(0, 3 - daysSinceExpiry)
    return <BillingBanner daysLeft={daysLeft} status="past_due" />
  }

  if (sub.status === "active") {
    const msPerDay = 86_400_000
    const daysUntilExpiry = Math.ceil(
      (new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / msPerDay,
    )
    if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
      return <BillingBanner daysLeft={daysUntilExpiry} status="expiring" />
    }
  }

  return null
}
