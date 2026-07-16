import {
  isPlatformAdmin,
  isSuperAdmin,
  quotaEnforcementService,
  subscriptionService,
  userQuotaService,
  workspaceMemberService,
} from "@chatbotx.io/business"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@chatbotx.io/ui/components/ui/sidebar"
import { getIdFromParams } from "@chatbotx.io/utils"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import type { QuotaSummary } from "@/components/nav-usage"
import { isCloud } from "@/env"
import { BillingBannerServer } from "@/features/billing/components/billing-banner-server"
import { getTenantSettings } from "@/features/tenant/utils"
import { enforcePasswordCurrent } from "@/lib/auth/require-password-current"
import { getCurrentUser } from "@/lib/auth/utils"
import { buildQuotaMetrics, resolveTrialEndsAt } from "@/lib/quota-metrics"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const workspaceId = getIdFromParams(await params, "workspaceId")
  if (!workspaceId) {
    return notFound()
  }

  const user = await getCurrentUser()
  if (!user) {
    return notFound()
  }

  enforcePasswordCurrent(user)

  const cloud = isCloud()

  // Check if user is a member of the workspace
  const [allWorkspaceMembers, { storageUrl }, platformAdmin, quota, usage] =
    await Promise.all([
      workspaceMemberService.listByUserId({ userId: user.id }),
      getTenantSettings(),
      isPlatformAdmin(user),
      userQuotaService.getForUser(user.id),
      quotaEnforcementService.getUsageSummary(user.id),
    ])
  const targetWorkspaceMember = allWorkspaceMembers.find(
    (workspaceMember) => workspaceMember.workspace.id === workspaceId,
  )
  if (!targetWorkspaceMember) {
    return notFound()
  }

  // Self-managed trial gate: block the workspace shell once the trial is
  // consumed. /trial-expired sits outside this layout so it stays reachable.
  // Derived from the quota already fetched above — no extra query.
  if (cloud && userQuotaService.getAccessStateFromQuota(quota).blocked) {
    redirect("/trial-expired")
  }

  if (!(cloud || platformAdmin)) {
    const subscription = await subscriptionService.findByUserId({
      userId: user.id,
    })
    if (subscription) {
      const now = Date.now()
      const periodEnd = new Date(subscription.currentPeriodEnd).getTime()
      const shouldBlock =
        subscription.status === "expired" ||
        (subscription.status === "trial" && periodEnd < now) ||
        (subscription.status === "past_due" &&
          periodEnd + 3 * 24 * 60 * 60 * 1000 < now)
      if (shouldBlock) {
        redirect("/pricing")
      }
    }
  }

  const allWorkspaces = allWorkspaceMembers.map((workspaceMember) => ({
    ...workspaceMember.workspace,
    logo: workspaceMember.workspace.logo
      ? new URL(workspaceMember.workspace.logo, storageUrl).toString()
      : null,
  }))

  const trialEndsAt = resolveTrialEndsAt(quota)

  const quotaSummary: QuotaSummary = {
    planName: quota?.planName ?? null,
    planStatus: quota?.planStatus ?? null,
    trialEndsAt,
    metrics: buildQuotaMetrics(usage),
  }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        allWorkspaces={allWorkspaces}
        isPlatformAdmin={platformAdmin}
        isSuperAdmin={isSuperAdmin(user)}
        permissions={targetWorkspaceMember.permissions}
        quota={quotaSummary}
        workspaceId={workspaceId}
      />
      <SidebarInset>
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          <BillingBannerServer userId={user.id} />
          {children}
        </main>
        <SidebarTrigger className="absolute top-3 -left-2 z-10 border" />
      </SidebarInset>
    </SidebarProvider>
  )
}
