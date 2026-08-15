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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@chatbotx.io/ui/components/ui/avatar"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@chatbotx.io/ui/components/ui/dropdown-menu"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import {
  BadgeCheckIcon,
  EyeIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  TrashIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { deleteUserAction } from "../actions/delete-user.action"
import { toggleVerificationAction } from "../actions/toggle-verification.action"

type UserRow = {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  tenantId: string
  status: string
  subscriptionStatus: string | null
  planName: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const t = useTranslations()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return users
    }
    const q = search.trim().toLowerCase()
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q),
    )
  }, [users, search])

  return (
    <div className="space-y-4">
      <Input
        className="max-w-xs"
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("platformAdmin.users.searchPlaceholder")}
        value={search}
      />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("platformAdmin.users.columns.user")}</TableHead>
              <TableHead>{t("platformAdmin.users.columns.verified")}</TableHead>
              <TableHead>
                {t("platformAdmin.users.columns.accountStatus")}
              </TableHead>
              <TableHead>{t("platformAdmin.users.columns.plan")}</TableHead>
              <TableHead>
                {t("platformAdmin.users.columns.subscriptionStatus")}
              </TableHead>
              <TableHead>{t("platformAdmin.users.columns.joinedAt")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-muted-foreground"
                  colSpan={7}
                >
                  {t("platformAdmin.users.noUsers")}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((user) => (
              <UserTableRow key={user.id} user={user} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const SUBSCRIPTION_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  active: "default",
  trial: "secondary",
  expired: "destructive",
  past_due: "outline",
  cancelled: "outline",
}

const ACCOUNT_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  active: "default",
  suspended: "secondary",
  banned: "destructive",
}

function UserTableRow({ user }: { user: UserRow }) {
  const t = useTranslations()
  const router = useRouter()

  const deleteAction = useAction(deleteUserAction.bind(null, user.id), {
    onSuccess: () => {
      toast.success(t("platformAdmin.users.messages.deleted"))
      router.refresh()
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  const verifyAction = useAction(toggleVerificationAction.bind(null, user.id), {
    onSuccess: () => {
      toast.success(t("platformAdmin.users.messages.verificationUpdated"))
      router.refresh()
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              alt={user.name ?? user.email}
              src={user.image ?? undefined}
            />
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name ?? "—"}</div>
            <div className="text-muted-foreground text-xs">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {user.emailVerified ? (
          <BadgeCheckIcon className="h-4 w-4 text-green-600" />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={ACCOUNT_STATUS_VARIANT[user.status] ?? "outline"}>
          {t(`platformAdmin.users.accountStatus.${user.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{user.planName ?? "—"}</TableCell>
      <TableCell>
        {user.subscriptionStatus ? (
          <Badge
            variant={
              SUBSCRIPTION_STATUS_VARIANT[user.subscriptionStatus] ?? "outline"
            }
          >
            {t(`subscriptions.status.${user.subscriptionStatus}`)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon" variant="ghost">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/users/${user.id}`)}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                {t("platformAdmin.users.actions.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={verifyAction.isPending}
                onClick={() =>
                  verifyAction.execute({ verified: !user.emailVerified })
                }
              >
                {verifyAction.isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!verifyAction.isPending && user.emailVerified && (
                  <ShieldOffIcon className="mr-2 h-4 w-4" />
                )}
                {!(verifyAction.isPending || user.emailVerified) && (
                  <ShieldCheckIcon className="mr-2 h-4 w-4" />
                )}
                {user.emailVerified
                  ? t("platformAdmin.users.actions.unverify")
                  : t("platformAdmin.users.actions.verify")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger
                render={
                  <DropdownMenuItem className="text-destructive">
                    <TrashIcon className="mr-2 h-4 w-4" />
                    {t("platformAdmin.users.actions.delete")}
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("platformAdmin.users.deleteDialog.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("platformAdmin.users.deleteDialog.description", {
                  email: user.email,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteAction.isPending}
                onClick={() => deleteAction.execute()}
              >
                {deleteAction.isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("actions.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}
