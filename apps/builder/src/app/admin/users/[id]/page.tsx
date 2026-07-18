import {
  billingPlanService,
  paymentHistoryService,
  userAdminService,
} from "@chatbotx.io/business"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@chatbotx.io/ui/components/ui/avatar"
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
import { ArrowLeftIcon, BadgeCheckIcon, XCircleIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { UserDetailActions } from "@/features/admin/components/user-detail-actions"

const SUBSCRIPTION_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  active: "default",
  trial: "secondary",
  expired: "destructive",
  past_due: "outline",
  cancelled: "outline",
}

const ACCOUNT_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  active: "default",
  suspended: "secondary",
  banned: "destructive",
}

const PAYMENT_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  paid: "default",
  refunded: "secondary",
  failed: "destructive",
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = getIdFromParams(await params, "id")
  if (!id) {
    return notFound()
  }

  const data = await userAdminService.findById({ id })
  if (!data) {
    return notFound()
  }

  const { user, subscription, workspaces } = data
  const t = await getTranslations()
  const locale = await getLocale()
  const dateLocale = locale === "ar" ? ar : undefined

  const fmtDate = (d: Date | string) =>
    format(new Date(d), "dd MMM yyyy", { locale: dateLocale })

  const [payments, plans] = await Promise.all([
    subscription
      ? paymentHistoryService.listBySubscriptionId({
          subscriptionId: subscription.id,
        })
      : Promise.resolve([]),
    billingPlanService.list({ activeOnly: true }),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:underline"
          href="/admin/users"
        >
          <ArrowLeftIcon className="size-3" /> {t("platformAdmin.users.title")}
        </Link>
        <h1 className="font-bold text-2xl">
          {t("platformAdmin.users.detail.title")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("platformAdmin.users.detail.userInfo")}
              <Badge variant={ACCOUNT_STATUS_VARIANT[user.status] ?? "outline"}>
                {t(`platformAdmin.users.accountStatus.${user.status}`)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  alt={user.name ?? user.email}
                  src={user.image ?? undefined}
                />
                <AvatarFallback>
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{user.name ?? "—"}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t("platformAdmin.users.columns.verified")}
                </span>
                <p className="flex items-center gap-1 font-medium">
                  {user.emailVerified ? (
                    <>
                      <BadgeCheckIcon className="h-4 w-4 text-green-600" />
                      {t("platformAdmin.users.detail.verified")}
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-muted-foreground" />
                      {t("platformAdmin.users.detail.unverified")}
                    </>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("platformAdmin.users.columns.joinedAt")}
                </span>
                <p className="font-medium">{fmtDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("platformAdmin.users.detail.tenantId")}
                </span>
                <p className="font-medium">{user.tenantId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("platformAdmin.users.detail.workspaces")}
                </span>
                <p className="font-medium">{workspaces.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("platformAdmin.users.detail.subscription")}
              {subscription && (
                <Badge
                  variant={
                    SUBSCRIPTION_STATUS_VARIANT[subscription.status] ??
                    "outline"
                  }
                >
                  {t(`subscriptions.status.${subscription.status}`)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {subscription ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">
                    {t("billing.manage.planName")}
                  </span>
                  <p className="font-medium">
                    {subscription.plan?.name ?? "—"}
                  </p>
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
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                {t("platformAdmin.users.detail.noSubscription")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("platformAdmin.users.detail.actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserDetailActions
            currentPlanId={subscription?.planId ?? null}
            currentStatus={user.status}
            plans={plans.map((p) => ({ id: p.id, name: p.name }))}
            userId={user.id}
          />
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
                        <Badge variant="outline">
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
