"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { CheckIcon, Loader2Icon } from "lucide-react"
import Script from "next/script"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type PlanCard = {
  id: string
  name: string
  description: string | null
  price: string
  billingCycle: "monthly" | "yearly"
  features: string[]
}

type MoyasarFormConfig = {
  publishable_api_key: string
  amount: number
  currency: string
  description: string
  callback_url: string
  methods: string[]
  apple_pay?: Record<string, unknown>
  supported_networks?: string[]
  metadata?: Record<string, string>
}

export function PricingCards({
  plans,
  currentPlanId,
}: {
  plans: PlanCard[]
  currentPlanId?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard currentPlanId={currentPlanId} key={plan.id} plan={plan} />
      ))}
    </div>
  )
}

function PricingCard({
  plan,
  currentPlanId,
}: {
  plan: PlanCard
  currentPlanId?: string
}) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [formConfig, setFormConfig] = useState<MoyasarFormConfig | null>(null)
  const isCurrent = currentPlanId === plan.id

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: plan.billingCycle,
        }),
      })
      const data = await res.json()

      if (data.type === "embedded" && data.formConfig) {
        setFormConfig(data.formConfig as MoyasarFormConfig)
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        toast.error(data.error ?? t("plans.messages.checkoutFailed"))
      }
    } catch {
      toast.error(t("plans.messages.checkoutFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className={cn("flex flex-col", isCurrent && "ring-2 ring-primary")}>
        <CardHeader className="text-center">
          {isCurrent && (
            <Badge className="mx-auto mb-2 w-fit" variant="default">
              {t("plans.currentPlan")}
            </Badge>
          )}
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          {plan.description && (
            <p className="text-muted-foreground text-sm">{plan.description}</p>
          )}
          <div className="mt-4">
            <span className="font-bold text-4xl">{plan.price}</span>
            <span className="text-muted-foreground text-sm">
              {" "}
              {t("plans.currency.sar")} / {t(`plans.${plan.billingCycle}`)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {plan.features.length > 0 && (
            <ul className="mb-6 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2 text-sm" key={feature}>
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
          <Button
            className="w-full"
            disabled={isCurrent || loading}
            onClick={handleSubscribe}
            size="lg"
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            {isCurrent ? t("plans.currentPlan") : t("plans.subscribe")}
          </Button>
        </CardContent>
      </Card>

      {formConfig && (
        <MoyasarPaymentDialog
          config={formConfig}
          onClose={() => setFormConfig(null)}
          planName={plan.name}
        />
      )}
    </>
  )
}

function MoyasarPaymentDialog({
  config,
  planName,
  onClose,
}: {
  config: MoyasarFormConfig
  planName: string
  onClose: () => void
}) {
  const t = useTranslations()
  const formRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const initializedRef = useRef(false)

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
      amount: config.amount,
      currency: config.currency,
      description: config.description,
      publishable_api_key: config.publishable_api_key,
      callback_url: config.callback_url,
      methods: config.methods,
      apple_pay: config.apple_pay,
      supported_networks: config.supported_networks,
      metadata: config.metadata,
      on_completed: () => {
        // Moyasar handles the redirect to callback_url automatically
      },
    })
  }, [config])

  useEffect(() => {
    if (scriptLoaded) {
      initForm()
    }
  }, [scriptLoaded, initForm])

  useEffect(
    () => () => {
      initializedRef.current = false
    },
    [],
  )

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("plans.checkout")}: {planName}
          </DialogTitle>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
          rel="stylesheet"
        />
        <Script
          onLoad={() => setScriptLoaded(true)}
          src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
          strategy="afterInteractive"
        />
        <div className="min-h-[300px]" ref={formRef} />
      </DialogContent>
    </Dialog>
  )
}
