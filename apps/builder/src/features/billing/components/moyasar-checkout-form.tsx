"use client"

import { ArrowRightIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    Moyasar: {
      init: (config: Record<string, unknown>) => void
    }
  }
}

type MoyasarCheckoutProps = {
  publishableKey: string
  amount: number
  currency: string
  description: string
  callbackUrl: string
  metadata: Record<string, string>
  planName: string
  planPrice: string
  billingCycle: "monthly" | "yearly"
}

export function MoyasarCheckoutForm({
  publishableKey,
  amount,
  currency,
  description,
  callbackUrl,
  metadata,
  planName,
  planPrice,
  billingCycle,
}: MoyasarCheckoutProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) {
      return
    }
    initializedRef.current = true

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
    script.async = true
    script.onload = () => {
      console.log(
        "[Moyasar] script loaded, window.Moyasar:",
        typeof window.Moyasar,
      )
      if (window.Moyasar) {
        window.Moyasar.init({
          element: ".mysr-form",
          amount,
          currency,
          description,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          methods: ["creditcard", "stcpay", "applepay"],
          credit_card: {
            save_card: true,
          },
          on_completed: (payment: Record<string, unknown>) => {
            const source = payment.source as Record<string, unknown> | undefined
            if (source?.token) {
              fetch("/api/billing/save-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: source.token,
                  brand: source.company ?? "",
                  lastFour: typeof source.number === "string" ? source.number : "",
                }),
              }).catch(() => {
                // fire-and-forget: token will also be extracted from verify response
              })
            }
          },
          apple_pay: {
            country: "SA",
            label: description,
            validate_merchant_url:
              "https://api.moyasar.com/v1/applepay/initiate",
          },
          supported_networks: ["mada", "visa", "mastercard", "amex"],
          metadata,
        })
        console.log("[Moyasar] init called")
      }
      setLoading(false)
    }
    script.onerror = () => {
      console.error("[Moyasar] failed to load script")
      setLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(link)
    }
  }, [amount, currency, description, publishableKey, callbackUrl, metadata])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl">{t("plans.checkout")}</h1>
        </div>

        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("plans.billing.planLabel")}
              </span>
              <span className="font-semibold">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("plans.billing.amountLabel")}
              </span>
              <span className="font-semibold">
                {planPrice} {t("plans.currency.sar")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("plans.fields.billingCycle")}
              </span>
              <span className="font-semibold">
                {t(`plans.billingCycleOptions.${billingCycle}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          {loading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="mysr-form" />
        </div>

        <div className="text-center">
          <Link
            className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:underline"
            href="/pricing"
          >
            <ArrowRightIcon className="size-3.5 rtl:rotate-180" />
            {t("plans.backToPricing")}
          </Link>
        </div>
      </div>
    </div>
  )
}
