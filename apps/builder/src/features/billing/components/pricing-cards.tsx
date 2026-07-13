"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

type PlanCard = {
  id: string
  name: string
  description: string | null
  price: string
  billingCycle: "monthly" | "yearly"
  features: string[]
}

export function PricingCards({
  plans,
  currentPlanId,
  gatewayType,
}: {
  plans: PlanCard[]
  currentPlanId?: string
  gatewayType: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard
          currentPlanId={currentPlanId}
          gatewayType={gatewayType}
          key={plan.id}
          plan={plan}
        />
      ))}
    </div>
  )
}

function PricingCard({
  plan,
  currentPlanId,
  gatewayType,
}: {
  plan: PlanCard
  currentPlanId?: string
  gatewayType: string
}) {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isCurrent = currentPlanId === plan.id

  async function handleSubscribe() {
    setLoading(true)
    try {
      if (gatewayType === "moyasar") {
        const params = new URLSearchParams({
          planId: plan.id,
          billingCycle: plan.billingCycle,
        })
        router.push(`/billing/checkout?${params.toString()}`)
        return
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: plan.billingCycle,
        }),
      })
      const data = await res.json()

      if (data.redirectUrl) {
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
  )
}
