"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

export function RetryPaymentButton() {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/retry-charge", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(t("billing.manage.retrySuccess"))
        router.refresh()
      } else {
        toast.error(data.error ?? t("billing.manage.retryFailed"))
      }
    } catch {
      toast.error(t("billing.manage.retryFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button disabled={loading} onClick={handleRetry} variant="destructive">
      {loading && <Loader2Icon className="size-4 animate-spin" />}
      {t("billing.manage.retryPayment")}
    </Button>
  )
}
