import {
  renewalService,
  resolveTenantSettingsByDomain,
} from "@chatbotx.io/business"
import { sendRenewalReminder } from "@chatbotx.io/mail"
import { format } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const expiring = await renewalService.findExpiringIn(3)
    let sent = 0

    const settings = await resolveTenantSettingsByDomain(null)

    for (const sub of expiring) {
      try {
        await sendRenewalReminder(sub.userEmail, {
          subject: `تجديد اشتراك ${sub.planName} قريباً`,
          brandName: settings.name,
          brandLogoUrl: settings.logoLightUrl,
          brandUrl: settings.appUrl,
          dir: "rtl",
          userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
          planName: sub.planName,
          amount: sub.amount,
          currency: sub.currency,
          cycle: sub.cycle,
          expiryDate: format(sub.currentPeriodEnd, "dd MMM yyyy"),
          renewUrl: `${settings.appUrl}/pricing`,
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
