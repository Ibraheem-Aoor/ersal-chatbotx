"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@chatbotx.io/ui/components/ui/tooltip"
import { BotIcon, ClockIcon, LockIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useWorkspaceId } from "@/hooks/routing"
import { useChatStore } from "../chat/store/chat-store-provider"
import { enableBotAction } from "../conversations/actions/enable-bot.action"
import { UpdateConversationAssignee } from "../conversations/components/update-conversation-assignee"
import { ConversationAction } from "../conversations/conversation-action"
import { isConversationActive } from "../conversations/utils/bot-state"

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Computes the remaining time in the WhatsApp 24h messaging window.
 * Returns { open: true, hours, minutes } when the window is still open,
 * or { open: false } when it has closed.
 */
function computeWindowStatus(lastIncomingAt: Date | string | null | undefined) {
  if (!lastIncomingAt) {
    return { open: false } as const
  }
  const anchor =
    lastIncomingAt instanceof Date
      ? lastIncomingAt.getTime()
      : new Date(lastIncomingAt).getTime()
  if (Number.isNaN(anchor)) {
    return { open: false } as const
  }
  const remaining = anchor + WHATSAPP_WINDOW_MS - Date.now()
  if (remaining <= 0) {
    return { open: false } as const
  }
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  return { open: true, hours, minutes } as const
}

function WhatsappWindowBadge({
  lastIncomingMessageAt,
}: {
  lastIncomingMessageAt: Date | string | null | undefined
}) {
  const t = useTranslations()

  const getStatus = useCallback(
    () => computeWindowStatus(lastIncomingMessageAt),
    [lastIncomingMessageAt],
  )

  const [status, setStatus] = useState(getStatus)

  // Re-compute every 60 seconds so the timer stays current
  useEffect(() => {
    setStatus(getStatus())
    const interval = setInterval(() => setStatus(getStatus()), 60_000)
    return () => clearInterval(interval)
  }, [getStatus])

  if (status.open) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              variant="outline"
            >
              <ClockIcon className="size-3" />
              <span className="tabular-nums text-[11px]">
                {status.hours > 0
                  ? `${status.hours}${t("whatsapp.window.hoursShort")} ${status.minutes}${t("whatsapp.window.minutesShort")}`
                  : `${status.minutes}${t("whatsapp.window.minutesShort")}`}
              </span>
            </Badge>
          }
        />
        <TooltipContent>
          <p>{t("whatsapp.window.openTooltip")}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            className="gap-1 border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400"
            variant="outline"
          >
            <LockIcon className="size-3" />
            <span className="text-[11px]">
              {t("whatsapp.window.closed")}
            </span>
          </Badge>
        }
      />
      <TooltipContent>
        <p>{t("whatsapp.window.closedTooltip")}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default function MessageHead() {
  const t = useTranslations()
  const workspaceId = useWorkspaceId()

  const {
    conversations,
    activeConversationId,
    setAssignee,
    updateConversation,
  } = useChatStore((state) => state)

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  )

  const { execute: enableBot, isExecuting: isEnablingBot } = useAction(
    enableBotAction.bind(null, workspaceId),
    {
      onSuccess: () => {
        if (activeConversation) {
          updateConversation(activeConversation.id, {
            botEnabled: true,
            botResumeAt: null,
          })
        }
      },
      onError: ({ error }) => {
        if (error.serverError) {
          toast.error(error.serverError)
        }
      },
    },
  )

  const contactInbox = activeConversation?.contactInboxes?.[0]
  const isWhatsapp = contactInbox?.channel === "whatsapp"

  return (
    activeConversation && (
      <div className="flex items-center gap-2 border-b px-3 pb-3">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-semibold">
              {activeConversation?.contact?.fullName}
            </span>
            {isWhatsapp && (
              <WhatsappWindowBadge
                lastIncomingMessageAt={contactInbox?.lastIncomingMessageAt}
              />
            )}
          </div>
          <UpdateConversationAssignee
            conversation={activeConversation}
            onChange={setAssignee}
          />
        </div>
        {!isConversationActive(activeConversation) && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  disabled={isEnablingBot}
                  onClick={() => {
                    enableBot({ ids: [activeConversation.id] })
                  }}
                  variant="ghost"
                >
                  <BotIcon />
                </Button>
              }
            />
            <TooltipContent>
              <p>{t("actions.transferConversationToBot")}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <ConversationAction conversation={activeConversation} />
      </div>
    )
  )
}
