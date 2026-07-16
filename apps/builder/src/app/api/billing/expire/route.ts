import { renewalService } from "@chatbotx.io/business"
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
    const brandName = process.env.BRAND_NAME ?? "ChatbotX"
    const brandLogoUrl = `${baseUrl}/logo.svg`

    const result = await renewalService.expirePastDue(3)

    for (const sub of result.expiredSubs) {
      try {
        await sendSubscriptionExpired(sub.userEmail, {
          subject: `Your ${sub.planName} subscription has expired`,
          brandName,
          brandLogoUrl,
          brandUrl: baseUrl,
          userName: sub.userName ?? sub.userEmail.split("@")[0] ?? "Customer",
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
