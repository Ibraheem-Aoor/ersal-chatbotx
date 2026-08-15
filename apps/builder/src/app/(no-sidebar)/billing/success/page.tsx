import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { CheckCircle2Icon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth/utils"

export default async function BillingSuccessPage(props: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const searchParams = await props.searchParams
  const planName = searchParams.planName
  const amount = searchParams.amount
  const currency = searchParams.currency ?? "SAR"
  const cycle = searchParams.cycle as "monthly" | "yearly" | undefined
  const periodStart = searchParams.periodStart
  const periodEnd = searchParams.periodEnd

  const dateLocale = locale === "ar" ? ar : undefined

  const formatDate = (iso: string | undefined) => {
    if (!iso) {
      return "—"
    }
    return format(new Date(iso), "dd MMM yyyy", { locale: dateLocale })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2Icon className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">
            {t("plans.billing.successTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {planName && (
            <div className="space-y-3 rounded-lg border p-4 text-start">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("plans.billing.planLabel")}
                </span>
                <span className="font-medium">{planName}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("plans.billing.amountLabel")}
                  </span>
                  <span className="font-medium">
                    {amount}{" "}
                    {currency === "SAR" ? t("plans.currency.sar") : currency}
                  </span>
                </div>
              )}
              {cycle && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("plans.fields.billingCycle")}
                  </span>
                  <span className="font-medium">
                    {t(`plans.billingCycleOptions.${cycle}`)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("plans.billing.periodLabel")}
                </span>
                <span className="font-medium">
                  {formatDate(periodStart)} → {formatDate(periodEnd)}
                </span>
              </div>
            </div>
          )}
          <Button className="w-full" render={<Link href="/" />} size="lg">
            {t("plans.billing.goToWorkspace")}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
