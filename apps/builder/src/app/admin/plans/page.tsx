import { billingPlanService } from "@chatbotx.io/business"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { PlusIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { PlanFormDialog } from "@/features/billing/components/plan-form-dialog"
import { PlansTable } from "@/features/billing/components/plans-table"

export default async function AdminPlansPage() {
  const t = await getTranslations()
  const plans = await billingPlanService.list()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">{t("plans.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("plans.description")}
          </p>
        </div>
        <PlanFormDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {t("plans.createPlan")}
            </Button>
          }
        />
      </div>

      <PlansTable plans={plans} />
    </div>
  )
}
