import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { XCircleIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth/utils"

const ERROR_KEYS: Record<string, string> = {
  payment_failed: "plans.billing.errors.paymentFailed",
  invalid_metadata: "plans.billing.errors.invalidMetadata",
  plan_not_found: "plans.billing.errors.planNotFound",
  callback_error: "plans.billing.errors.callbackError",
}

export default async function BillingErrorPage(props: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  const t = await getTranslations()
  const searchParams = await props.searchParams
  const reason = searchParams.reason ?? "callback_error"
  const errorKey = ERROR_KEYS[reason] ?? "plans.billing.errors.callbackError"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircleIcon className="size-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">
            {t("plans.billing.errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{t(errorKey)}</p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              render={<Link href="/pricing" />}
              size="lg"
            >
              {t("plans.billing.tryAgain")}
            </Button>
            <Button
              className="w-full"
              render={<Link href="/" />}
              size="lg"
              variant="outline"
            >
              {t("plans.billing.goToWorkspace")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
