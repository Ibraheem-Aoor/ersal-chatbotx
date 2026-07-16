import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/utils"

const pendingTokens = new Map<
  string,
  { token: string; brand?: string; lastFour?: string; expiresAt: number }
>()

export function getPendingToken(userId: string) {
  const entry = pendingTokens.get(userId)
  if (!entry) {
    return null
  }
  if (Date.now() > entry.expiresAt) {
    pendingTokens.delete(userId)
    return null
  }
  pendingTokens.delete(userId)
  return entry
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { token, brand, lastFour } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 })
    }

    pendingTokens.set(user.id, {
      token,
      brand: brand ?? undefined,
      lastFour: lastFour ?? undefined,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 })
  }
}
