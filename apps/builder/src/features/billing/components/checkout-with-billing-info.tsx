"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { EditIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { BillingInfoForm } from "./billing-info-form"
import { MoyasarCheckoutForm } from "./moyasar-checkout-form"

type BillingInfoData = {
  companyName: string
  vatNumber: string | null
  billingEmail: string
  country: string
  city: string | null
  address: string | null
}

type Props = {
  publishableKey: string
  amount: number
  currency: string
  description: string
  callbackUrl: string
  metadata: Record<string, string>
  planName: string
  planPrice: string
  billingCycle: "monthly" | "yearly"
  billingInfo: BillingInfoData | null
}

export function CheckoutWithBillingInfo({
  billingInfo,
  ...moyasarProps
}: Props) {
  const t = useTranslations()
  const [showPayment, setShowPayment] = useState(!!billingInfo)
  const [editing, setEditing] = useState(false)

  if (!showPayment || editing) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
        <div className="w-full space-y-6">
          <div className="text-center">
            <h1 className="font-bold text-2xl">{t("plans.checkout")}</h1>
          </div>
          <BillingInfoForm
            billingInfo={billingInfo}
            onSaved={() => {
              setShowPayment(true)
              setEditing(false)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
      <div className="w-full space-y-4">
        {billingInfo && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {t("billing.billingInfo.title")}
              </CardTitle>
              <Button
                onClick={() => setEditing(true)}
                size="sm"
                variant="ghost"
              >
                <EditIcon className="size-3.5" />
                {t("billing.billingInfo.edit")}
              </Button>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{billingInfo.companyName}</p>
              {billingInfo.vatNumber && (
                <p className="text-muted-foreground">{billingInfo.vatNumber}</p>
              )}
              <p className="text-muted-foreground">
                {billingInfo.billingEmail}
              </p>
            </CardContent>
          </Card>
        )}
        <MoyasarCheckoutForm {...moyasarProps} />
      </div>
    </div>
  )
}
