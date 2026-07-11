"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import { EditIcon, Loader2Icon, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { deletePlanAction } from "../actions/delete-plan.action"
import type { CreatePlanInput } from "../schema/plan"
import { PlanFormDialog } from "./plan-form-dialog"

type PlanRow = {
  id: string
  name: string
  description: string | null
  price: string
  currency: string
  limits: CreatePlanInput["limits"]
  features: string[]
  isActive: boolean
  sortOrder: number
}

export function PlansTable({ plans }: { plans: PlanRow[] }) {
  const t = useTranslations()

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("plans.fields.name")}</TableHead>
            <TableHead>{t("plans.fields.price")}</TableHead>
            <TableHead>{t("plans.limits.title")}</TableHead>
            <TableHead>{t("plans.fields.isActive")}</TableHead>
            <TableHead>{t("plans.fields.sortOrder")}</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 && (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={6}
              >
                {t("plans.noPlans")}
              </TableCell>
            </TableRow>
          )}
          {plans.map((plan) => (
            <PlanTableRow key={plan.id} plan={plan} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PlanTableRow({ plan }: { plan: PlanRow }) {
  const t = useTranslations()
  const router = useRouter()
  const deleteAction = useAction(deletePlanAction.bind(null, plan.id), {
    onSuccess: () => {
      toast.success(t("plans.messages.deleted"))
      router.refresh()
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  const limitsText = [
    `${plan.limits.contacts} ${t("plans.limits.contacts")}`,
    `${plan.limits.mac} MAC`,
    `${plan.limits.workspaces} ${t("plans.limits.workspaces")}`,
  ].join(" · ")

  return (
    <TableRow>
      <TableCell className="font-medium">{plan.name}</TableCell>
      <TableCell>
        {plan.price} {t("plans.currency.sar")}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {limitsText}
      </TableCell>
      <TableCell>
        <Badge variant={plan.isActive ? "default" : "secondary"}>
          {plan.isActive ? t("plans.active") : t("plans.inactive")}
        </Badge>
      </TableCell>
      <TableCell>{plan.sortOrder}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <PlanFormDialog
            plan={plan}
            trigger={
              <Button size="icon" variant="ghost">
                <EditIcon className="size-4" />
              </Button>
            }
          />
          <Button
            disabled={deleteAction.isPending}
            onClick={() => deleteAction.execute()}
            size="icon"
            variant="ghost"
          >
            {deleteAction.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <TrashIcon className="size-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
