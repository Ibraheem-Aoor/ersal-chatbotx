"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { EditIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
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
  editingBillingInfo: BillingInfoData | null
  planId: string
}

export function CheckoutWithBillingInfo({
  billingInfo,
  editingBillingInfo,
  planId,
  billingCycle,
  ...moyasarProps
}: Props) {
  const t = useTranslations()
  const router = useRouter()

  if (!billingInfo) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
        <div className="w-full space-y-6">
          <div className="text-center">
            <h1 className="font-bold text-2xl">{t("plans.checkout")}</h1>
          </div>
          <BillingInfoForm
            billingInfo={editingBillingInfo}
            onSaved={() => {
              router.push(
                `/billing/checkout?planId=${planId}&billingCycle=${billingCycle}`,
              )
              router.refresh()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6">
      <div className="w-full space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">
              {t("billing.billingInfo.title")}
            </CardTitle>
            <Button
              onClick={() =>
                router.push(
                  `/billing/checkout?planId=${planId}&billingCycle=${billingCycle}&edit=billing`,
                )
              }
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
            <p className="text-muted-foreground">{billingInfo.billingEmail}</p>
          </CardContent>
        </Card>
        <MoyasarCheckoutForm
          {...moyasarProps}
          billingCycle={billingCycle}
          planName={moyasarProps.planName}
          planPrice={moyasarProps.planPrice}
        />
      </div>
    </div>
  )
}
