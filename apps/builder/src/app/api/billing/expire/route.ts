import { renewalService, tenantService } from "@chatbotx.io/business"
import { ROOT_TENANT_ID } from "@chatbotx.io/database/schema"
import { sendSubscriptionExpired } from "@chatbotx.io/mail"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "@/env"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const baseUrl = env.NEXT_PUBLIC_BUILDER_URL
    const tenant = await tenantService.findById(ROOT_TENANT_ID)
    const brandName = tenant?.brandName ?? "Ersal"
    const brandLogoUrl = `${baseUrl}/brand/logo.svg`

    const result = await renewalService.expirePastDue(3)

    for (const sub of result.expiredSubs) {
      try {
        await sendSubscriptionExpired(sub.userEmail, {
          subject: `انتهى اشتراكك في باقة ${sub.planName}`,
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
