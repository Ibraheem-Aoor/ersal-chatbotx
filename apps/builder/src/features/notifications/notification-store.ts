import { createStore, useStore } from "zustand"

type NotificationState = {
  /** Per-conversation unread message counts. */
  unreadCounts: Map<string, number>
  /** The conversation the user is currently viewing (inbox page). */
  activeConversationId: string | null
}

type NotificationActions = {
  /**
   * Called when an incoming message arrives via the workspace realtime socket.
   * Increments the unread counter and plays a notification sound unless the
   * message belongs to the currently active conversation.
   */
  handleIncomingMessage: (conversationId: string) => void
  /** Mark a single conversation as read. */
  markRead: (conversationId: string) => void
  /** Clear all unread state (called when the user enters the inbox). */
  clearAll: () => void
  /** Track which conversation is currently open in the inbox. */
  setActiveConversation: (id: string | null) => void
}

type NotificationStore = NotificationState & NotificationActions

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

let cachedAudio: HTMLAudioElement | null = null

function playNotificationSound() {
  try {
    if (typeof window === "undefined") {
      return
    }
    if (!cachedAudio) {
      cachedAudio = new Audio("/sounds/notification.wav")
      cachedAudio.volume = 0.5
    }
    // Reset to the beginning in case a previous play is still going
    cachedAudio.currentTime = 0
    cachedAudio.play().catch(() => {
      // Autoplay blocked — ignore silently
    })
  } catch {
    // Audio not supported — ignore
  }
}

// ---------------------------------------------------------------------------
// Document title
// ---------------------------------------------------------------------------

let originalTitle: string | null = null

function updateDocumentTitle(count: number) {
  if (typeof document === "undefined") {
    return
  }
  if (originalTitle === null) {
    originalTitle = document.title
  }
  document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle
}

/** Sum all values in the unread map. */
function totalUnread(counts: Map<string, number>): number {
  let total = 0
  for (const c of counts.values()) {
    total += c
  }
  return total
}

// ---------------------------------------------------------------------------
// Store (global singleton — NOT React context-based)
// ---------------------------------------------------------------------------

export const notificationStore = createStore<NotificationStore>((set, get) => ({
  unreadCounts: new Map<string, number>(),
  activeConversationId: null,

  handleIncomingMessage: (conversationId: string) => {
    const { activeConversationId, unreadCounts } = get()

    // Don't count as unread if the user is already viewing this conversation
    if (conversationId === activeConversationId) {
      return
    }

    const newMap = new Map(unreadCounts)
    newMap.set(conversationId, (newMap.get(conversationId) ?? 0) + 1)

    set({ unreadCounts: newMap })

    const count = totalUnread(newMap)
    updateDocumentTitle(count)

    // Play sound for every incoming message
    playNotificationSound()
  },

  markRead: (conversationId: string) => {
    const { unreadCounts } = get()
    if (!unreadCounts.has(conversationId)) {
      return
    }

    const newMap = new Map(unreadCounts)
    newMap.delete(conversationId)
    set({ unreadCounts: newMap })
    updateDocumentTitle(totalUnread(newMap))
  },

  clearAll: () => {
    set({ unreadCounts: new Map() })
    updateDocumentTitle(0)
  },

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id })
    if (id) {
      get().markRead(id)
    }
  },
}))

// ---------------------------------------------------------------------------
// React hook for consuming the store in components
// ---------------------------------------------------------------------------

export function useNotificationStore<T>(
  selector: (state: NotificationStore) => T,
): T {
  return useStore(notificationStore, selector)
}

/**
 * Convenience selector: returns the total unread message count.
 * Usage: `const count = useUnreadCount()`
 */
export function useUnreadCount(): number {
  return useNotificationStore((s) => totalUnread(s.unreadCounts))
}
