import { subscriptionService } from "@chatbotx.io/business"
import { getTranslations } from "next-intl/server"
import { SubscriptionsTable } from "@/features/billing/components/subscriptions-table"

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations()
  const rows = await subscriptionService.listAll()

  const subscriptions = rows.map((row) => ({
    id: row.id,
    userName: row.userName ?? "",
    userEmail: row.userEmail ?? "",
    planName: row.planName ?? "",
    amount: row.amount,
    currency: row.currency,
    cycle: row.cycle,
    status: row.status,
    periodStart: row.currentPeriodStart.toISOString(),
    periodEnd: row.currentPeriodEnd.toISOString(),
    paymentGateway: row.paymentGateway,
    gatewayPaymentId: row.gatewayPaymentId,
    createdAt: row.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl">{t("subscriptions.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("subscriptions.description")}
        </p>
      </div>
      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  )
}
