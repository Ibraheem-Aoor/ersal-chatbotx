import {
  quotaEnforcementService,
  subscriptionService,
} from "@chatbotx.io/business"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chatbotx.io/ui/components/ui/tooltip"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth/utils"

const STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  active: "default",
  trial: "secondary",
  expired: "destructive",
  past_due: "outline",
  cancelled: "outline",
}

export default async function BillingManagePage() {
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const dateLocale = locale === "ar" ? ar : undefined

  const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMM yyyy", { locale: dateLocale })

  const subscription = await subscriptionService.findByUserId({
    userId: user.id,
  })

  const usage = await quotaEnforcementService.getUsageSummary(user.id)

  const usageMetrics = [
    { key: "contacts", label: t("billing.usage.contacts") },
    { key: "mac", label: t("billing.usage.mac") },
    { key: "workspaces", label: t("billing.usage.workspaces") },
    { key: "channels", label: t("billing.usage.channels") },
    { key: "teamMembers", label: t("billing.usage.teamMembers") },
    { key: "flows", label: t("billing.usage.flows") },
    { key: "broadcasts", label: t("billing.usage.broadcasts") },
  ] as const

  const allSubscriptions = await subscriptionService.listAll({
    search: user.email,
  })

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link
          className="text-muted-foreground text-sm hover:underline"
          href="/"
        >
          <ArrowLeftIcon className="mb-0.5 inline size-3" /> {t("actions.back")}
        </Link>
        <h1 className="font-bold text-2xl">{t("billing.manage.title")}</h1>
      </div>

      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("billing.manage.planDetails")}
              <Badge variant={STATUS_VARIANT[subscription.status] ?? "outline"}>
                {t(`subscriptions.status.${subscription.status}`)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t("billing.manage.planName")}
                </span>
                <p className="font-medium">{subscription.plan?.name ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("billing.manage.price")}
                </span>
                <p className="font-medium">
                  {subscription.amount} {subscription.currency}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("billing.manage.cycle")}
                </span>
                <p className="font-medium">
                  {t(`plans.billingCycleOptions.${subscription.cycle}`)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("billing.manage.period")}
                </span>
                <p className="font-medium">
                  {fmtDate(subscription.currentPeriodStart)} →{" "}
                  {fmtDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href="/pricing">{t("billing.manage.changePlan")}</Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled variant="outline">
                      {t("billing.manage.cancelSubscription")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("billing.manage.comingSoon")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-lg">{t("billing.manage.noPlan")}</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("billing.manage.noPlanDescription")}
            </p>
            <Button asChild className="mt-4">
              <Link href="/pricing">{t("billing.manage.viewPlans")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.manage.usageSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {usageMetrics.map(({ key, label }) => {
              const m = usage[key]
              return (
                <div className="rounded-lg border p-3 text-center" key={key}>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="mt-1 font-semibold text-lg">
                    {m.used}
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      {t("billing.manage.of")}{" "}
                      {m.limit === null
                        ? t("billing.manage.unlimited")
                        : m.limit}
                    </span>
                  </p>
                  {m.limit !== null && (
                    <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (m.used / m.limit) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.manage.paymentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {allSubscriptions.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              {t("billing.manage.noPayments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("subscriptions.columns.plan")}</TableHead>
                    <TableHead>{t("subscriptions.columns.amount")}</TableHead>
                    <TableHead>{t("subscriptions.columns.status")}</TableHead>
                    <TableHead>{t("subscriptions.columns.period")}</TableHead>
                    <TableHead>{t("subscriptions.columns.gateway")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSubscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.planName}
                      </TableCell>
                      <TableCell>
                        {s.amount} {s.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                          {t(`subscriptions.status.${s.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {fmtDate(s.currentPeriodStart)} →{" "}
                        {fmtDate(s.currentPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {s.paymentGateway ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
