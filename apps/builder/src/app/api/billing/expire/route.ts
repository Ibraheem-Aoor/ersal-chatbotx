import { renewalService } from "@chatbotx.io/business"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.RENEWAL_CRON_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await renewalService.expirePastDue(3)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Expiry processing failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
