import {
  billingInfoService,
  renewalService,
  resolveTenantSettingsByDomain,
} from "@chatbotx.io/business"
import { sendPaymentConfirmation, sendPaymentFailed } from "@chatbotx.io/mail"
import { format } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const due = await renewalService.findDueForRenewal(0)
    let renewed = 0
    let failed = 0

    const settings = await resolveTenantSettingsByDomain(null)

    for (const sub of due) {
      if (!sub.paymentToken) {
        continue
      }

      const result = await renewalService.renewSubscription({
        id: sub.id,
        userId: sub.userId,
        planId: sub.planId,
        cycle: sub.cycle,
        amount: sub.amount,
        currency: sub.currency,
        paymentToken: sub.paymentToken,
        planName: sub.planName,
        planPrice: sub.planPrice,
        planCurrency: sub.planCurrency,
        planLimits: sub.planLimits,
      })

      if (result.success) {
        renewed++
        try {
          const [billingInfo] = await Promise.all([
            billingInfoService.findByUserId({ userId: sub.userId }),
          ])
          const total = Number.parseFloat(sub.planPrice)
          const base = Math.round((total / 1.15) * 100) / 100
          const vat = Math.round((total - base) * 100) / 100
          const recipientEmail = billingInfo?.billingEmail ?? sub.userEmail
          const receiptUrl = `${settings.appUrl}/billing/receipt/${result.paymentHistoryId}`

          await sendPaymentConfirmation(recipientEmail, {
            subject: `تأكيد الدفع - ${sub.planName}`,
            brandName: settings.name,
            brandLogoUrl: settings.logoLightUrl,
            brandUrl: settings.appUrl,
            dir: "rtl",
            userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
            planName: sub.planName,
            amount: sub.planPrice,
            currency: sub.planCurrency,
            cycle: sub.cycle,
            periodStart: format(result.periodStart, "dd MMM yyyy"),
            periodEnd: format(result.periodEnd, "dd MMM yyyy"),
            gatewayPaymentId: result.gatewayPaymentId,
            companyName: billingInfo?.companyName,
            vatNumber: billingInfo?.vatNumber ?? undefined,
            baseAmount: base.toFixed(2),
            vatAmount: vat.toFixed(2),
            totalAmount: total.toFixed(2),
            receiptUrl,
          })
        } catch (err) {
          console.error(
            `[billing:renew] Failed to send confirmation email to ${sub.userEmail}:`,
            err,
          )
        }
      } else {
        failed++
        try {
          await sendPaymentFailed(sub.userEmail, {
            subject: `فشل دفع اشتراك ${sub.planName}`,
            brandName: settings.name,
            brandLogoUrl: settings.logoLightUrl,
            brandUrl: settings.appUrl,
            dir: "rtl",
            userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
            planName: sub.planName,
            renewUrl: settings.appUrl,
          })
        } catch (err) {
          console.error(
            `[billing:renew] Failed to send payment-failed email to ${sub.userEmail}:`,
            err,
          )
        }
      }
    }

    return NextResponse.json({ renewed, failed })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Renewal processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
