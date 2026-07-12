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
import { ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

type PaymentRow = {
  id: string
  createdAt: string
  userEmail: string
  userName: string
  planName: string
  amount: string
  currency: string
  type: string
  status: string
  paymentGateway: string
  gatewayPaymentId: string
  subscriptionId: string | null
}

const TYPE_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  new: "default",
  upgrade: "default",
  downgrade: "outline",
  renewal: "secondary",
}

const STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  paid: "default",
  refunded: "secondary",
  failed: "destructive",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PaymentHistoryTable({ payments }: { payments: PaymentRow[] }) {
  const t = useTranslations()
  const [typeFilter, setTypeFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let result = payments
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => p.userEmail.toLowerCase().includes(q))
    }
    return result
  }, [payments, typeFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("subscriptions.filters.searchPlaceholder")}
          value={search}
        />
        <Select onValueChange={setTypeFilter} value={typeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("billing.paymentHistory.filters.allTypes")}
            </SelectItem>
            <SelectItem value="new">
              {t("billing.paymentHistory.type.new")}
            </SelectItem>
            <SelectItem value="upgrade">
              {t("billing.paymentHistory.type.upgrade")}
            </SelectItem>
            <SelectItem value="downgrade">
              {t("billing.paymentHistory.type.downgrade")}
            </SelectItem>
            <SelectItem value="renewal">
              {t("billing.paymentHistory.type.renewal")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("billing.paymentHistory.columns.date")}</TableHead>
              <TableHead>{t("subscriptions.columns.user")}</TableHead>
              <TableHead>{t("billing.paymentHistory.columns.plan")}</TableHead>
              <TableHead>
                {t("billing.paymentHistory.columns.amount")}
              </TableHead>
              <TableHead>{t("billing.paymentHistory.columns.type")}</TableHead>
              <TableHead>
                {t("billing.paymentHistory.columns.status")}
              </TableHead>
              <TableHead>
                {t("billing.paymentHistory.columns.gateway")}
              </TableHead>
              <TableHead>{t("subscriptions.columns.gatewayId")}</TableHead>
              <TableHead>
                {t("billing.paymentHistory.columns.subscription")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-muted-foreground"
                  colSpan={9}
                >
                  {t("billing.manage.noPayments")}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">
                  {formatDate(p.createdAt)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{p.userName}</div>
                    <div className="text-muted-foreground text-xs">
                      {p.userEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.planName}</TableCell>
                <TableCell>
                  {p.amount} {p.currency}
                </TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANT[p.type] ?? "outline"}>
                    {t(`billing.paymentHistory.type.${p.type}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                    {t(`billing.paymentHistory.status.${p.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {p.paymentGateway}
                </TableCell>
                <TableCell className="max-w-32 truncate text-muted-foreground text-xs">
                  {p.gatewayPaymentId}
                </TableCell>
                <TableCell>
                  {p.subscriptionId ? (
                    <Link
                      className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      href={`/admin/subscriptions/${p.subscriptionId}`}
                    >
                      {t("billing.paymentHistory.viewSubscription")}
                      <ExternalLinkIcon className="size-3" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
