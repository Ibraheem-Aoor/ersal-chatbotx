import {
  renewalService,
  resolveTenantSettingsByDomain,
} from "@chatbotx.io/business"
import { sendSubscriptionExpired } from "@chatbotx.io/mail"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await resolveTenantSettingsByDomain(null)

    const result = await renewalService.expirePastDue(3)

    for (const sub of result.expiredSubs) {
      try {
        await sendSubscriptionExpired(sub.userEmail, {
          subject: `انتهى اشتراكك في باقة ${sub.planName}`,
          brandName: settings.name,
          brandLogoUrl: settings.logoLightUrl,
          brandUrl: settings.appUrl,
          dir: "rtl",
          userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "العميل",
          planName: sub.planName,
          renewUrl: `${settings.appUrl}/pricing`,
        })
      } catch (err) {
        console.error(
          `[billing:expire] Failed to send expiry email to ${sub.userEmail}:`,
          err,
        )
      }
    }

    return NextResponse.json({ expired: result.expired })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Expiry processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
