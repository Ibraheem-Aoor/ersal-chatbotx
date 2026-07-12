"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chatbotx.io/ui/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

type SubscriptionRow = {
  id: string
  userName: string
  userEmail: string
  planName: string
  amount: string
  currency: string
  cycle: "monthly" | "yearly"
  status: string
  periodStart: string
  periodEnd: string
  paymentGateway: string | null
  gatewayPaymentId: string | null
  createdAt: string
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function SubscriptionsTable({
  subscriptions,
}: {
  subscriptions: SubscriptionRow[]
}) {
  const t = useTranslations()
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let result = subscriptions
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) => s.userEmail.toLowerCase().includes(q))
    }
    return result
  }, [subscriptions, statusFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("subscriptions.filters.searchPlaceholder")}
          value={search}
        />
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("subscriptions.filters.allStatuses")}
            </SelectItem>
            <SelectItem value="active">
              {t("subscriptions.status.active")}
            </SelectItem>
            <SelectItem value="trial">
              {t("subscriptions.status.trial")}
            </SelectItem>
            <SelectItem value="expired">
              {t("subscriptions.status.expired")}
            </SelectItem>
            <SelectItem value="past_due">
              {t("subscriptions.status.past_due")}
            </SelectItem>
            <SelectItem value="cancelled">
              {t("subscriptions.status.cancelled")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("subscriptions.columns.user")}</TableHead>
              <TableHead>{t("subscriptions.columns.plan")}</TableHead>
              <TableHead>{t("subscriptions.columns.amount")}</TableHead>
              <TableHead>{t("subscriptions.columns.cycle")}</TableHead>
              <TableHead>{t("subscriptions.columns.status")}</TableHead>
              <TableHead>{t("subscriptions.columns.period")}</TableHead>
              <TableHead>{t("subscriptions.columns.gateway")}</TableHead>
              <TableHead>{t("subscriptions.columns.gatewayId")}</TableHead>
              <TableHead>{t("subscriptions.columns.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-muted-foreground"
                  colSpan={9}
                >
                  {t("subscriptions.noSubscriptions")}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{sub.userName}</div>
                    <div className="text-muted-foreground text-xs">
                      {sub.userEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{sub.planName}</TableCell>
                <TableCell>
                  {sub.amount} {sub.currency}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t(`plans.billingCycleOptions.${sub.cycle}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[sub.status] ?? "outline"}>
                    {t(`subscriptions.status.${sub.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(sub.periodStart)} → {formatDate(sub.periodEnd)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {sub.paymentGateway ?? "—"}
                </TableCell>
                <TableCell className="max-w-32 truncate text-muted-foreground text-xs">
                  {sub.gatewayPaymentId ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(sub.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
