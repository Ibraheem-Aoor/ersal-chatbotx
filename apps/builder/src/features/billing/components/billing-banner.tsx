"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { XIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

type BillingBannerProps = {
  status: "expiring" | "past_due" | "expired"
  daysLeft?: number
}

function getStorageKey(status: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `billing_banner_dismissed_${status}_${today}`
}

export function BillingBanner({ status, daysLeft }: BillingBannerProps) {
  const t = useTranslations()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const key = getStorageKey(status)
    setDismissed(localStorage.getItem(key) === "1")
  }, [status])

  if (dismissed) {
    return null
  }

  function handleDismiss() {
    localStorage.setItem(getStorageKey(status), "1")
    setDismissed(true)
  }

  const isDestructive = status === "past_due" || status === "expired"

  let message: string
  let ctaLabel: string

  if (status === "expiring") {
    message = t("billing.banner.expiring", { days: daysLeft ?? 3 })
    ctaLabel = t("billing.banner.renewCta")
  } else if (status === "past_due") {
    message = t("billing.banner.pastDue", { days: daysLeft ?? 3 })
    ctaLabel = t("billing.banner.payCta")
  } else {
    message = t("billing.banner.expired")
    ctaLabel = t("billing.banner.upgradeCta")
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${
        isDestructive
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-yellow-500/30 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200"
      }`}
    >
      <p className="flex-1">{message}</p>
      <div className="flex items-center gap-2">
        <Button
          render={<Link href="/pricing" />}
          size="sm"
          variant={isDestructive ? "destructive" : "default"}
        >
          {ctaLabel}
        </Button>
        <button
          className="rounded p-1 opacity-60 hover:opacity-100"
          onClick={handleDismiss}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
