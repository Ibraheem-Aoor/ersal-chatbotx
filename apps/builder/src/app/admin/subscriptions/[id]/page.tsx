import {
  paymentHistoryService,
  quotaEnforcementService,
  subscriptionService,
} from "@chatbotx.io/business"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
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
import { getIdFromParams } from "@chatbotx.io/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

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

const PAYMENT_TYPE_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  new: "default",
  upgrade: "default",
  downgrade: "outline",
  renewal: "secondary",
}

const PAYMENT_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  paid: "default",
  refunded: "secondary",
  failed: "destructive",
}

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = getIdFromParams(await params, "id")
  if (!id) {
    return notFound()
  }

  const subscription = await subscriptionService.findById({ id })
  if (!subscription) {
    return notFound()
  }

  const t = await getTranslations()
  const locale = await getLocale()
  const dateLocale = locale === "ar" ? ar : undefined

  const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMM yyyy", { locale: dateLocale })

  const [usage, payments] = await Promise.all([
    quotaEnforcementService.getUsageSummary(subscription.userId),
    paymentHistoryService.listBySubscriptionId({
      subscriptionId: subscription.id,
    }),
  ])

  const usageMetrics = [
    { key: "contacts", label: t("billing.usage.contacts") },
    { key: "mac", label: t("billing.usage.mac") },
    { key: "workspaces", label: t("billing.usage.workspaces") },
    { key: "channels", label: t("billing.usage.channels") },
    { key: "teamMembers", label: t("billing.usage.teamMembers") },
  ] as const

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:underline"
          href="/admin/subscriptions"
        >
          <ArrowLeftIcon className="size-3" /> {t("subscriptions.title")}
        </Link>
        <h1 className="font-bold text-2xl">
          {t("billing.subscriptionDetail.title")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("billing.manage.planDetails")}
              <Badge variant={STATUS_VARIANT[subscription.status] ?? "outline"}>
                {t(`subscriptions.status.${subscription.status}`)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("billing.subscriptionDetail.userInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">
                {t("billing.subscriptionDetail.userName")}
              </span>
              <p className="font-medium">{subscription.user?.name ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("billing.subscriptionDetail.userEmail")}
              </span>
              <p className="font-medium">{subscription.user?.email ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("subscriptions.columns.createdAt")}
              </span>
              <p className="font-medium">{fmtDate(subscription.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("billing.manage.usageSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <CardTitle>
            {t("billing.subscriptionDetail.paymentTimeline")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              {t("billing.manage.noPayments")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("billing.paymentHistory.columns.date")}
                    </TableHead>
                    <TableHead>
                      {t("billing.paymentHistory.columns.plan")}
                    </TableHead>
                    <TableHead>
                      {t("billing.paymentHistory.columns.amount")}
                    </TableHead>
                    <TableHead>
                      {t("billing.paymentHistory.columns.type")}
                    </TableHead>
                    <TableHead>
                      {t("billing.paymentHistory.columns.status")}
                    </TableHead>
                    <TableHead>
                      {t("billing.paymentHistory.columns.gateway")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">
                        {fmtDate(p.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.planName}
                      </TableCell>
                      <TableCell>
                        {p.amount} {p.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={PAYMENT_TYPE_VARIANT[p.type] ?? "outline"}
                        >
                          {t(`billing.paymentHistory.type.${p.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            PAYMENT_STATUS_VARIANT[p.status] ?? "outline"
                          }
                        >
                          {t(`billing.paymentHistory.status.${p.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {p.paymentGateway}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
