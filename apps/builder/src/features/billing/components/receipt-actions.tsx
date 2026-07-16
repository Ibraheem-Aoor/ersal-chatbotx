"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { PrinterIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function ReceiptActions() {
  const t = useTranslations()
  const router = useRouter()

  return (
    <div className="no-print flex justify-center gap-3 pt-4">
      <Button onClick={() => window.print()} variant="default">
        <PrinterIcon className="size-4" />
        {t("billing.receipt.print")}
      </Button>
      <Button onClick={() => router.back()} variant="outline">
        {t("billing.receipt.back")}
      </Button>
    </div>
  )
}
