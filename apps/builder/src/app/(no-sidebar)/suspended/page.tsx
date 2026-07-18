import { BanIcon, PauseCircleIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { SignOut } from "@/features/auth/sign-out"
import { getCurrentUser } from "@/lib/auth/utils"

export default async function SuspendedPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/sign-in")
  }

  if (user.status !== "suspended" && user.status !== "banned") {
    redirect("/")
  }

  const t = await getTranslations("platformAdmin.users.suspendedPage")
  const isBanned = user.status === "banned"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="max-w-md space-y-4">
        {isBanned ? (
          <BanIcon className="mx-auto h-16 w-16 text-destructive" />
        ) : (
          <PauseCircleIcon className="mx-auto h-16 w-16 text-yellow-500" />
        )}
        <h1 className="font-bold text-2xl tracking-tight">
          {isBanned ? t("bannedTitle") : t("suspendedTitle")}
        </h1>
        <p className="text-muted-foreground">
          {isBanned ? t("bannedDescription") : t("suspendedDescription")}
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted-foreground text-sm">{t("contactSupport")}</p>
        <SignOut />
      </div>
    </main>
  )
}
