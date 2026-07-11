import { billingPlanService, isPlatformAdmin } from "@chatbotx.io/business"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PlanFormDialog } from "@/features/billing/components/plan-form-dialog"
import { PlansTable } from "@/features/billing/components/plans-table"
import { getCurrentUser } from "@/lib/auth/utils"

export default async function AdminPlansPage() {
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const admin = await isPlatformAdmin(user)
  if (!admin) {
    return notFound()
  }

  const t = await getTranslations()
  const plans = await billingPlanService.list()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            className="text-muted-foreground text-sm hover:underline"
            href="/"
          >
            {t("actions.back")}
          </Link>
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
