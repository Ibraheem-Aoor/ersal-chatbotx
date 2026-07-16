import { renewalService, tenantService } from "@chatbotx.io/business"
import { ROOT_TENANT_ID } from "@chatbotx.io/database/schema"
import { sendPaymentFailed } from "@chatbotx.io/mail"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"

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

    const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
    const tenant = await tenantService.findById(ROOT_TENANT_ID)
    const brandName = tenant?.brandName ?? "Ersal"
    const brandLogoUrl = `${baseUrl}/brand/logo.svg`

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
      } else {
        failed++
        try {
          await sendPaymentFailed(sub.userEmail, {
            subject: `فشل دفع اشتراك ${sub.planName}`,
            brandName,
            brandLogoUrl,
            brandUrl: baseUrl,
            dir: "rtl",
            userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
            planName: sub.planName,
            renewUrl: `${baseUrl}/pricing`,
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
