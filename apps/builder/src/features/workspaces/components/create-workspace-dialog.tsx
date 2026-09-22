"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import type { ReactElement } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { createWorkspaceAction } from "../actions/create-workspace.action"

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
})

type CreateWorkspaceDialogProps = {
  children?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateWorkspaceDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateWorkspaceDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (next: boolean) => controlledOnOpenChange?.(next)
    : setInternalOpen

  const form = useForm({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "" },
  })

  const { execute, isExecuting } = useAction(createWorkspaceAction, {
    onSuccess: ({ data }) => {
      if (data?.workspaceId) {
        toast.success(
          t("messages.createdSuccess", {
            feature: t("fields.workspace.label"),
          }),
        )
        setOpen(false)
        router.push(`/space/${data.workspaceId}`)
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? t("errors.somethingWentWrong"))
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    execute({
      name: values.name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  })

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset()
        }
      }}
      open={open}
    >
      {children && <DialogTrigger render={children} />}
      {!(children || isControlled) && (
        <DialogTrigger>
          <Button size="sm" variant="outline">
            <PlusCircleIcon className="size-4" />
            {t("actions.createFeature", {
              feature: t("fields.workspace.label"),
            })}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("actions.createFeature", {
              feature: t("fields.workspace.label"),
            })}
          </DialogTitle>
          <DialogDescription>
            {t("workspaces.create.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <InputField
              label={t("fields.workspace.name")}
              name="name"
              placeholder={t("fields.workspace.namePlaceholder")}
              required
            />
            <DialogFooter>
              <DialogClose
                render={
                  <Button disabled={isExecuting} type="button" variant="ghost">
                    {t("actions.cancel")}
                  </Button>
                }
              />
              <Button disabled={isExecuting} type="submit">
                {isExecuting && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                {t("actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
