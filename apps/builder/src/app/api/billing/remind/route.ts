import {
  renewalService,
  resolveTenantSettingsByDomain,
} from "@chatbotx.io/business"
import {
  sendActiveNoTokenReminder,
  sendRenewalReminder,
  sendTrialExpiryReminder,
} from "@chatbotx.io/mail"
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
        const userName = sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل"
        const expiryDate = format(sub.currentPeriodEnd, "dd MMM yyyy")
        const baseProps = {
          brandName: settings.name,
          brandLogoUrl: settings.logoLightUrl,
          brandUrl: settings.appUrl,
          dir: "rtl" as const,
        }

        if (sub.status === "trial") {
          await sendTrialExpiryReminder(sub.userEmail, {
            ...baseProps,
            subject: "فترة تجربتك تنتهي قريباً",
            userName,
            planName: sub.planName,
            expiryDate,
            renewUrl: `${settings.appUrl}/pricing`,
          })
        } else if (sub.paymentToken) {
          await sendRenewalReminder(sub.userEmail, {
            ...baseProps,
            subject: "سيتم تجديد اشتراكك قريباً",
            userName,
            planName: sub.planName,
            amount: sub.amount,
            currency: sub.currency,
            cycle: sub.cycle,
            expiryDate,
            renewUrl: settings.appUrl,
          })
        } else {
          await sendActiveNoTokenReminder(sub.userEmail, {
            ...baseProps,
            subject: "اشتراكك ينتهي قريباً",
            userName,
            planName: sub.planName,
            expiryDate,
            renewUrl: settings.appUrl,
          })
        }
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
        status: s.status,
        expiresAt: s.currentPeriodEnd.toISOString(),
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reminder processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
