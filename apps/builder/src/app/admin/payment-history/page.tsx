import { paymentHistoryService } from "@chatbotx.io/business"
import { getTranslations } from "next-intl/server"
import { PaymentHistoryTable } from "@/features/billing/components/payment-history-table"

export default async function AdminPaymentHistoryPage() {
  const t = await getTranslations()
  const rows = await paymentHistoryService.listAll()

  const payments = rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    userEmail: row.userEmail ?? "",
    userName: row.userName ?? "",
    planName: row.planName,
    amount: row.amount,
    currency: row.currency,
    type: row.type,
    status: row.status,
    paymentGateway: row.paymentGateway,
    gatewayPaymentId: row.gatewayPaymentId,
    subscriptionId: row.subscriptionId,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl">
          {t("billing.manage.paymentHistory")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("billing.paymentHistory.adminDescription")}
        </p>
      </div>
      <PaymentHistoryTable payments={payments} />
    </div>
  )
}
