"use client"

import {
  type RealtimeEventData,
  RealtimeEventType,
} from "@chatbotx.io/partysocket-config"
import usePartySocket from "partysocket/react"
import { useTenantSettings } from "@/features/tenant"
import { authClient } from "@/lib/auth/auth-client"
import { notificationStore } from "./notification-store"

/**
 * Lightweight workspace-level realtime listener.
 *
 * Unlike `ChatRealtime` (which lives inside the inbox page and handles the full
 * message flow), this component is mounted at the workspace **layout** level so
 * it stays connected on every page. It only cares about `messageCreated` events
 * for incoming messages — it increments the global unread counter and plays the
 * notification sound via the notification store.
 */
export function WorkspaceNotifications({
  workspaceId,
}: {
  workspaceId: string
}) {
  const { wsUrl } = useTenantSettings()

  usePartySocket({
    host: wsUrl,
    room: workspaceId,
    party: "workspaces",

    query: async () => {
      const oneTimeToken = await authClient.oneTimeToken.generate()
      return { token: oneTimeToken.data?.token }
    },

    onMessage(e) {
      try {
        const { eventType, data } = JSON.parse(e.data) as RealtimeEventData

        if (eventType === RealtimeEventType.messageCreated) {
          const msg = data as {
            messageType?: string
            conversationId?: string
          }
          if (msg.messageType === "incoming" && msg.conversationId) {
            notificationStore
              .getState()
              .handleIncomingMessage(msg.conversationId)
          }
        }
      } catch {
        // Malformed event — ignore
      }
    },
  })

  return null
}
