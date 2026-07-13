"use client"

import { ArrowRightIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import Script from "next/script"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

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
  const formRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const [scriptReady, setScriptReady] = useState(false)

  const initForm = useCallback(() => {
    if (!formRef.current || initializedRef.current) {
      return
    }
    const win = window as unknown as Record<string, unknown>
    if (typeof win.Moyasar !== "object" || !win.Moyasar) {
      return
    }

    initializedRef.current = true
    const moyasar = win.Moyasar as {
      init: (opts: Record<string, unknown>) => void
    }
    moyasar.init({
      element: formRef.current,
      amount,
      currency,
      description,
      publishable_api_key: publishableKey,
      callback_url: callbackUrl,
      methods: ["creditcard", "stcpay", "applepay"],
      apple_pay: {
        country: "SA",
        label: description,
        validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate",
      },
      supported_networks: ["mada", "visa", "mastercard", "amex"],
      metadata,
    })
  }, [amount, currency, description, publishableKey, callbackUrl, metadata])

  useEffect(() => {
    if (scriptReady) {
      initForm()
    }
  }, [scriptReady, initForm])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
        rel="stylesheet"
      />
      <Script
        onReady={() => setScriptReady(true)}
        src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
        strategy="afterInteractive"
      />

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
          {!scriptReady && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={formRef} />
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
