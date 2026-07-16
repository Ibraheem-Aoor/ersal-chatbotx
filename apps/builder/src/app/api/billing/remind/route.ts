import { renewalService } from "@chatbotx.io/business"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const expiring = await renewalService.findExpiringIn(3)

    for (const sub of expiring) {
      console.log(
        `[billing:remind] Subscription ${sub.id} for user ${sub.userId} ` +
          `(${sub.userEmail}) expires at ${sub.currentPeriodEnd.toISOString()}. ` +
          `Plan: ${sub.planName}, Amount: ${sub.amount} ${sub.currency}`,
      )
    }

    return NextResponse.json({
      reminded: expiring.length,
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
