import { userAdminService } from "@chatbotx.io/business"
import { getTranslations } from "next-intl/server"
import { UsersTable } from "@/features/admin/components/users-table"

export default async function AdminUsersPage() {
  const t = await getTranslations()
  const rows = await userAdminService.listAll()

  const users = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    createdAt: row.createdAt.toISOString(),
    tenantId: row.tenantId,
    status: row.status,
    subscriptionStatus: row.subscriptionStatus,
    planName: row.planName,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl">{t("platformAdmin.users.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("platformAdmin.users.description")}
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
