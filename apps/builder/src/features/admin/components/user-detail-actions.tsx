"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@chatbotx.io/ui/components/ui/alert-dialog"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chatbotx.io/ui/components/ui/select"
import {
  BanIcon,
  CheckCircleIcon,
  Loader2Icon,
  PauseCircleIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { changeUserPlanAction } from "../actions/change-user-plan.action"
import { setUserStatusAction } from "../actions/set-user-status.action"

type Plan = {
  id: string
  name: string
}

export function UserDetailActions({
  userId,
  currentStatus,
  plans,
  currentPlanId,
}: {
  userId: string
  currentStatus: string
  plans: Plan[]
  currentPlanId: string | null
}) {
  const t = useTranslations()
  const router = useRouter()
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId ?? "")

  const statusAction = useAction(setUserStatusAction.bind(null, userId), {
    onSuccess: () => {
      toast.success(t("platformAdmin.users.messages.statusUpdated"))
      router.refresh()
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  const planAction = useAction(changeUserPlanAction.bind(null, userId), {
    onSuccess: ({ data }) => {
      toast.success(
        t("platformAdmin.users.messages.planChanged", {
          plan: data?.planName ?? "",
        }),
      )
      router.refresh()
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  const isPending = statusAction.isPending || planAction.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {currentStatus === "active" && (
          <Button
            disabled={isPending}
            onClick={() => statusAction.execute({ status: "suspended" })}
            size="sm"
            variant="outline"
          >
            {statusAction.isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PauseCircleIcon className="mr-2 h-4 w-4" />
            )}
            {t("platformAdmin.users.actions.suspend")}
          </Button>
        )}

        {currentStatus === "suspended" && (
          <Button
            disabled={isPending}
            onClick={() => statusAction.execute({ status: "active" })}
            size="sm"
            variant="outline"
          >
            {statusAction.isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="mr-2 h-4 w-4" />
            )}
            {t("platformAdmin.users.actions.activate")}
          </Button>
        )}

        {currentStatus !== "banned" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isPending} size="sm" variant="destructive">
                <BanIcon className="mr-2 h-4 w-4" />
                {t("platformAdmin.users.actions.ban")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("platformAdmin.users.banDialog.title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("platformAdmin.users.banDialog.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => statusAction.execute({ status: "banned" })}
                >
                  {t("platformAdmin.users.actions.ban")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {currentStatus === "banned" && (
          <Button
            disabled={isPending}
            onClick={() => statusAction.execute({ status: "active" })}
            size="sm"
            variant="outline"
          >
            {statusAction.isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            {t("platformAdmin.users.actions.unban")}
          </Button>
        )}
      </div>

      {plans.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">
              {t("platformAdmin.users.actions.changePlan")}
            </span>
            <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
              <SelectTrigger className="w-48">
                <SelectValue
                  placeholder={t("platformAdmin.users.actions.selectPlan")}
                />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={
              isPending || !selectedPlanId || selectedPlanId === currentPlanId
            }
            onClick={() => planAction.execute({ planId: selectedPlanId })}
            size="sm"
          >
            {planAction.isPending && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("platformAdmin.users.actions.applyPlan")}
          </Button>
        </div>
      )}
    </div>
  )
}
