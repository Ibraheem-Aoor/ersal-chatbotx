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
import { FileTextIcon, Loader2Icon, LockIcon, WorkflowIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { useWorkspaceId } from "@/hooks/routing"
import { client } from "@/lib/orpc/orpc"
import { createMessageAction } from "../actions/create-message.action"
import { sendTemplateAction } from "../actions/send-template.action"

type WindowClosedActionsProps = {
  conversationId: string
  inboxId: string
}

export function WindowClosedActions({
  conversationId,
  inboxId,
}: WindowClosedActionsProps) {
  const t = useTranslations()
  const workspaceId = useWorkspaceId()

  return (
    <div className="m-3 rounded-xl border pt-2">
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LockIcon className="size-4" />
          <p className="text-sm">{t("messages.messagingWindowClosed")}</p>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("messages.windowClosedHint")}
        </p>
        <div className="flex gap-2">
          <SendTemplateButton
            conversationId={conversationId}
            inboxId={inboxId}
            workspaceId={workspaceId}
          />
          <SendFlowButton
            conversationId={conversationId}
            workspaceId={workspaceId}
          />
        </div>
      </div>
    </div>
  )
}

function SendTemplateButton({
  workspaceId,
  conversationId,
  inboxId,
}: {
  workspaceId: string
  conversationId: string
  inboxId: string
}) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  const { data: templates, isLoading } = useSWR(
    open ? (["approved-templates", workspaceId, inboxId] as const) : null,
    ([, ws, inbox]) =>
      client.whatsappMessageTemplateAPIs.listWhatsappMessageTemplatesInternalAPI(
        {
          workspaceId: ws,
          inboxId: inbox,
          status: "APPROVED",
        },
      ),
  )

  const handleTemplateChange = useCallback(
    (value: unknown) => setSelectedTemplateId(String(value)),
    [],
  )

  const { execute: sendTemplate, isExecuting } = useAction(
    sendTemplateAction.bind(null, workspaceId, conversationId),
    {
      onSuccess: () => {
        toast.success(t("messages.templateSentSuccess"))
        setOpen(false)
        setSelectedTemplateId("")
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? t("messages.templateSentError"))
      },
    },
  )

  const handleSend = useCallback(() => {
    if (selectedTemplateId) {
      sendTemplate({ templateId: selectedTemplateId })
    }
  }, [selectedTemplateId, sendTemplate])

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger
        render={
          <Button size="sm" variant="outline">
            <FileTextIcon className="size-4" />
            {t("messages.sendTemplate")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("messages.sendTemplate")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("messages.sendTemplateDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && templates && templates.length > 0 && (
            <Select
              onValueChange={handleTemplateChange}
              value={selectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("messages.selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isLoading && (!templates || templates.length === 0) && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              {t("messages.noApprovedTemplates")}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!selectedTemplateId || isExecuting}
            onClick={handleSend}
          >
            {isExecuting && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            {t("actions.send")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SendFlowButton({
  workspaceId,
  conversationId,
}: {
  workspaceId: string
  conversationId: string
}) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [selectedFlowId, setSelectedFlowId] = useState<string>("")

  const { data: flowsData, isLoading } = useSWR(
    open ? (["active-flows", workspaceId] as const) : null,
    ([, ws]) =>
      client.flowsAPI.privateListFlowsAPI({
        workspaceId: ws,
        active: true,
      }),
  )

  const flows = flowsData?.data ?? []

  const handleFlowChange = useCallback(
    (value: unknown) => setSelectedFlowId(String(value)),
    [],
  )

  const { execute: sendFlow, isExecuting } = useAction(
    createMessageAction.bind(null, workspaceId, conversationId),
    {
      onSuccess: () => {
        toast.success(t("messages.flowTriggeredSuccess"))
        setOpen(false)
        setSelectedFlowId("")
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? t("messages.flowTriggeredError"))
      },
    },
  )

  const handleSend = useCallback(() => {
    if (selectedFlowId) {
      sendFlow({ flowId: selectedFlowId })
    }
  }, [selectedFlowId, sendFlow])

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger
        render={
          <Button size="sm" variant="outline">
            <WorkflowIcon className="size-4" />
            {t("messages.triggerFlow")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("messages.triggerFlow")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("messages.triggerFlowDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && flows.length > 0 && (
            <Select onValueChange={handleFlowChange} value={selectedFlowId}>
              <SelectTrigger>
                <SelectValue placeholder={t("messages.selectFlow")} />
              </SelectTrigger>
              <SelectContent>
                {flows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isLoading && flows.length === 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              {t("messages.noActiveFlows")}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!selectedFlowId || isExecuting}
            onClick={handleSend}
          >
            {isExecuting && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            {t("actions.send")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
