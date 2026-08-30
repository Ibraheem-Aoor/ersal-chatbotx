"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@chatbotx.io/ui/components/ui/avatar"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@chatbotx.io/ui/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@chatbotx.io/ui/components/ui/sidebar"
import {
  Check,
  CreditCard,
  Crown,
  Loader2Icon,
  LogOutIcon,
  Monitor,
  Moon,
  PencilIcon,
  Settings2,
  ShieldCheck,
  SparklesIcon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useState, useTransition } from "react"
import { UpgradePlanDialog } from "@/enterprise/features/billing/upgrade-plan-dialog"
import { isCloud } from "@/env"
import { EditProfileDialog } from "@/features/workspaces/components/edit-profile-dialog"
import { RefreshAllChannelTokensButton } from "@/features/workspaces/components/refresh-all-channel-tokens-button"
import {
  enabledLocales,
  isLocale,
  localeMeta,
  resolveLocale,
} from "@/i18n/config"
import { authClient } from "@/lib/auth/auth-client"
import { useUserAvatarUrl } from "@/lib/auth/avatar"
import { setUserLocale } from "@/lib/locale"

export function NavUser({
  user,
  isSuperAdmin,
  isPlatformAdmin,
  planName,
  workspaceId,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  isSuperAdmin?: boolean
  isPlatformAdmin?: boolean
  planName?: string | null
  workspaceId?: string
}) {
  const { isMobile } = useSidebar()
  const t = useTranslations()
  const router = useRouter()
  const avatarUrl = useUserAvatarUrl(user.avatar)

  // Controlled state for dialogs rendered OUTSIDE the DropdownMenu tree.
  // Base UI forbids nesting interactive floating primitives (Dialog, Popover,
  // nested Menu) inside Menu.Item — doing so triggers production error #31.
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Theme switching — inlined as plain menu items (same pattern as locale
  // below). Embedding ThemeSwitcher's Button components inside a
  // DropdownMenuItem triggers Base UI error #31.
  const { theme, setTheme } = useTheme()
  const themeOptions = [
    { value: "light", icon: Sun, label: t("theme.light") },
    { value: "dark", icon: Moon, label: t("theme.dark") },
    { value: "system", icon: Monitor, label: t("theme.system") },
  ] as const

  // Locale switching — inlined because there are only 2 enabled locales,
  // no need for the Popover+Command that LangSelector uses.
  const locale = resolveLocale(useLocale())
  const [isLocalePending, startLocaleTransition] = useTransition()

  function onChangeLocale(value: string) {
    if (!isLocale(value)) {
      return
    }
    startLocaleTransition(async () => {
      await setUserLocale(value)
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* ---- Dialogs rendered OUTSIDE the menu tree ---- */}
        {isCloud() && (
          <UpgradePlanDialog
            onOpenChange={setUpgradeOpen}
            open={upgradeOpen}
          />
        )}
        <EditProfileDialog
          onOpenChange={setEditProfileOpen}
          open={editProfileOpen}
          user={{
            name: user.name,
            email: user.email,
            image: user.avatar,
          }}
        />
        <Dialog onOpenChange={setSignOutOpen} open={signOutOpen}>
          <DialogContent className="max-h-screen max-w-xl overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>{t("actions.signOut")}</DialogTitle>
              <DialogDescription>
                {t("messages.signOutConfirmation")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2">
              <DialogClose
                render={
                  <Button size="sm" type="button" variant="ghost">
                    {t("actions.cancel")}
                  </Button>
                }
              />
              <Button
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true)
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/auth/sign-in")
                      },
                    },
                  })
                }}
                size="sm"
                variant="destructive"
              >
                {isSigningOut && <Loader2Icon className="animate-spin" />}
                {t("actions.signOut")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---- The dropdown menu itself ---- */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage alt={user.name} src={avatarUrl ?? ""} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2) || "  "}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-(--anchor-width) min-w-72 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage alt={user.name} src={avatarUrl ?? ""} />
                    <AvatarFallback className="rounded-lg">
                      {user.name.slice(0, 2) || "  "}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                  {/* Plain button — opens the controlled EditProfileDialog above */}
                  <Button
                    className="ms-auto shrink-0"
                    onClick={() => setEditProfileOpen(true)}
                    size="icon"
                    variant="outline"
                  >
                    <PencilIcon aria-hidden className="size-4" />
                    <span className="sr-only">{t("actions.edit")}</span>
                  </Button>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Plan + upgrade is cloud-only; self-hosted editions get everything free. */}
            {isCloud() && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
                    {t("billing.plan.label", {
                      plan: planName ?? t("billing.plan.free"),
                    })}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => {
                      setUpgradeOpen(true)
                    }}
                  >
                    <Crown className="me-2 h-4 w-4" />
                    {t("actions.upgradePlan")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={
                      <Link href="/portal/billing">
                        <CreditCard className="me-2 h-4 w-4" />
                        {t("billing.title")}
                      </Link>
                    }
                  />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            {workspaceId && (
              <>
                <DropdownMenuGroup>
                  {planName && (
                    <DropdownMenuLabel className="flex items-center gap-2 py-1">
                      <Badge variant="secondary">{planName}</Badge>
                    </DropdownMenuLabel>
                  )}
                  {planName ? (
                    <DropdownMenuItem
                      render={
                        <Link href={`/space/${workspaceId}/billing`}>
                          <CreditCard className="h-4 w-4" />
                          {t("actions.manageSubscription")}
                        </Link>
                      }
                    />
                  ) : (
                    <DropdownMenuItem
                      render={
                        <Link href="/pricing">
                          <SparklesIcon className="h-4 w-4" />
                          {t("actions.subscribeNow")}
                        </Link>
                      }
                    />
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            {/* Language — inline items (only 2 locales, no need for Popover) */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
                {t("fields.language.label")}
              </DropdownMenuLabel>
              {enabledLocales.map((loc) => (
                <DropdownMenuItem
                  disabled={isLocalePending}
                  key={loc}
                  onClick={() => onChangeLocale(loc)}
                >
                  {localeMeta[loc].nativeLabel}
                  {locale === loc && (
                    <Check className="ms-auto h-4 w-4 opacity-100" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Theme — plain menu items (no nested interactive component) */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
                {t("fields.theme.label")}
              </DropdownMenuLabel>
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {theme === value && (
                    <Check className="ms-auto h-4 w-4 opacity-100" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {(isSuperAdmin || isPlatformAdmin) && (
              <>
                <DropdownMenuGroup>
                  {isSuperAdmin && (
                    <DropdownMenuItem
                      render={
                        <Link href="/admin">
                          <ShieldCheck className="h-4 w-4" />
                          {t("actions.admin")}
                        </Link>
                      }
                    />
                  )}
                  {isCloud() && isPlatformAdmin && (
                    <DropdownMenuItem
                      render={
                        <Link href="/manage">
                          <Settings2 className="h-4 w-4" />
                          {t("actions.manage")}
                        </Link>
                      }
                    />
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem render={<RefreshAllChannelTokensButton />} />
            {/* SignOut — plain menu item, opens the controlled Dialog above */}
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
            >
              <LogOutIcon className="h-4 w-4" />
              {t("actions.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
