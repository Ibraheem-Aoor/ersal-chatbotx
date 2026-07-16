import { renewalService, tenantService } from "@chatbotx.io/business"
import { ROOT_TENANT_ID } from "@chatbotx.io/database/schema"
import { sendRenewalReminder } from "@chatbotx.io/mail"
import { format } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const expiring = await renewalService.findExpiringIn(3)
    let sent = 0

    const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
    const tenant = await tenantService.findById(ROOT_TENANT_ID)
    const brandName = tenant?.brandName ?? "Ersal"
    const brandLogoUrl = `${baseUrl}/brand/logo.svg`

    for (const sub of expiring) {
      try {
        await sendRenewalReminder(sub.userEmail, {
          subject: `تجديد اشتراك ${sub.planName} قريباً`,
          brandName,
          brandLogoUrl,
          brandUrl: baseUrl,
          dir: "rtl",
          userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
          planName: sub.planName,
          amount: sub.amount,
          currency: sub.currency,
          cycle: sub.cycle,
          expiryDate: format(sub.currentPeriodEnd, "dd MMM yyyy"),
          renewUrl: `${baseUrl}/pricing`,
        })
        sent++
      } catch (err) {
        console.error(
          `[billing:remind] Failed to send reminder to ${sub.userEmail}:`,
          err,
        )
      }
    }

    return NextResponse.json({
      found: expiring.length,
      sent,
      subscriptions: expiring.map((s) => ({
        id: s.id,
        userId: s.userId,
        planName: s.planName,
        expiresAt: s.currentPeriodEnd.toISOString(),
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reminder processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
