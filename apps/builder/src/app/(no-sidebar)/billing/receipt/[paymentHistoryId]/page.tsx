import {
  billingInfoService,
  isPlatformAdmin,
  paymentHistoryService,
} from "@chatbotx.io/business"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { ReceiptActions } from "@/features/billing/components/receipt-actions"
import { getTenantSettings } from "@/features/tenant/utils"
import { getCurrentUser } from "@/lib/auth/utils"

function vatBreakdown(totalStr: string) {
  const total = Number.parseFloat(totalStr)
  const base = Math.round((total / 1.15) * 100) / 100
  const vat = Math.round((total - base) * 100) / 100
  return {
    base: base.toFixed(2),
    vat: vat.toFixed(2),
    total: total.toFixed(2),
  }
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentHistoryId: string }>
}) {
  const { paymentHistoryId } = await params
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const payment = await paymentHistoryService.findById({ id: paymentHistoryId })
  if (!payment) {
    return notFound()
  }

  const admin = await isPlatformAdmin(user)
  if (payment.userId !== user.id && !admin) {
    return notFound()
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const dateLocale = locale === "ar" ? ar : undefined
  const settings = await getTenantSettings()
  const billingInfo = await billingInfoService.findByUserId({
    userId: payment.userId,
  })

  const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMM yyyy", { locale: dateLocale })

  const { base, vat, total } = vatBreakdown(payment.amount)

  return (
    <div className="receipt-page mx-auto max-w-2xl p-8">
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: print styles
        dangerouslySetInnerHTML={{
          __html:
            "@media print { .no-print { display: none !important; } .receipt-page { padding: 0 !important; } }",
        }}
      />

      <div className="space-y-8">
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            {settings.logoLightUrl && (
              <Image
                alt={settings.name}
                className="mb-2 h-10 w-auto"
                height={40}
                src={settings.logoLightUrl}
                unoptimized
                width={120}
              />
            )}
            <h1 className="font-bold text-2xl">{t("billing.receipt.title")}</h1>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">
              {t("billing.receipt.receiptNumber")}
            </p>
            <p className="font-medium font-mono">{payment.id}</p>
            <p className="mt-1 text-muted-foreground">
              {t("billing.receipt.date")}
            </p>
            <p className="font-medium">{fmtDate(payment.createdAt)}</p>
          </div>
        </div>

        {billingInfo && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold text-sm">
              {t("billing.receipt.companyInfo")}
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{billingInfo.companyName}</p>
              {billingInfo.vatNumber && (
                <p className="text-muted-foreground">
                  {t("billing.billingInfo.vatNumber")}: {billingInfo.vatNumber}
                </p>
              )}
              {billingInfo.address && (
                <p className="text-muted-foreground">{billingInfo.address}</p>
              )}
              {billingInfo.city && (
                <p className="text-muted-foreground">
                  {billingInfo.city}, {billingInfo.country}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold text-sm">
            {t("billing.receipt.planDetails")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("billing.receipt.planName")}
            </span>
            <span className="font-medium">{payment.planName}</span>
            <span className="text-muted-foreground">
              {t("billing.receipt.paymentType")}
            </span>
            <span className="font-medium">
              {t(`billing.paymentHistory.type.${payment.type}`)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold text-sm">
            {t("billing.receipt.amountBreakdown")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("billing.receipt.subtotal")}
              </span>
              <span>
                {base} {payment.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("billing.receipt.vat")}
              </span>
              <span>
                {vat} {payment.currency}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{t("billing.receipt.total")}</span>
              <span>
                {total} {payment.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold text-sm">
            {t("billing.receipt.paymentInfo")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("billing.receipt.gateway")}
            </span>
            <span className="font-medium">{payment.paymentGateway}</span>
            <span className="text-muted-foreground">
              {t("billing.receipt.referenceNumber")}
            </span>
            <span className="font-mono text-xs">
              {payment.gatewayPaymentId}
            </span>
            <span className="text-muted-foreground">
              {t("billing.receipt.paymentStatus")}
            </span>
            <Badge
              variant={payment.status === "paid" ? "default" : "destructive"}
            >
              {t(`billing.paymentHistory.status.${payment.status}`)}
            </Badge>
          </div>
        </div>

        <ReceiptActions />
      </div>
    </div>
  )
}
