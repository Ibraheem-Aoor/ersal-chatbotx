"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { toast } from "sonner"

export function StaleDeploymentDetector() {
  const t = useTranslations("errors")

  useEffect(() => {
    function handleRejection(event: PromiseRejectionEvent) {
      const msg =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? "")
      if (!msg.includes("Failed to find Server Action")) {
        return
      }

      event.preventDefault()

      toast.error(t("staleDeployment"), {
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: t("staleDeploymentReload"),
          onClick: () => window.location.reload(),
        },
      })
    }

    window.addEventListener("unhandledrejection", handleRejection)
    return () =>
      window.removeEventListener("unhandledrejection", handleRejection)
  }, [t])

  return null
}
