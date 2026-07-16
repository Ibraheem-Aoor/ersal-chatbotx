"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { saveBillingInfoAction } from "../actions/save-billing-info.action"
import { billingInfoSchema } from "../schema/billing-info"

type BillingInfoData = {
  companyName: string
  vatNumber: string | null
  billingEmail: string
  country: string
  city: string | null
  address: string | null
}

export function BillingInfoForm({
  billingInfo,
  onSaved,
}: {
  billingInfo?: BillingInfoData | null
  onSaved?: () => void
}) {
  const t = useTranslations()
  const router = useRouter()

  const { form, handleSubmitWithAction } = useHookFormAction(
    saveBillingInfoAction,
    zodResolver(billingInfoSchema),
    {
      actionProps: {
        onSuccess: () => {
          toast.success(t("billing.billingInfo.saved"))
          router.refresh()
          onSaved?.()
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError)
          }
        },
      },
      formProps: {
        mode: "onChange",
        defaultValues: {
          companyName: billingInfo?.companyName ?? "",
          vatNumber: billingInfo?.vatNumber ?? "",
          billingEmail: billingInfo?.billingEmail ?? "",
          country: billingInfo?.country ?? "SA",
          city: billingInfo?.city ?? "",
          address: billingInfo?.address ?? "",
        },
      },
    },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("billing.billingInfo.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmitWithAction}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label={t("billing.billingInfo.companyName")}
                name="companyName"
                required
              />
              <InputField
                label={t("billing.billingInfo.vatNumber")}
                name="vatNumber"
              />
            </div>
            <InputField
              label={t("billing.billingInfo.billingEmail")}
              name="billingEmail"
              required
              type="email"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField
                label={t("billing.billingInfo.country")}
                name="country"
              />
              <InputField label={t("billing.billingInfo.city")} name="city" />
              <InputField
                label={t("billing.billingInfo.address")}
                name="address"
              />
            </div>
            <div className="flex justify-end">
              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {t("actions.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
