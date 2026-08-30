"use client"

import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { refreshAllChannelTokensAction } from "../actions/refresh-all-channel-tokens.action"

/**
 * Used as a `render` element inside `DropdownMenuItem`. Base UI clones the
 * element and merges its own props (role, tabIndex, keyboard handlers, ref)
 * via `React.cloneElement`. Spreading `...rest` onto the root `<button>`
 * ensures those props reach the DOM; without it, menu keyboard navigation
 * and ARIA attributes break silently.
 */
export function RefreshAllChannelTokensButton({
  ref,
  ...rest
}: ComponentProps<"button">) {
  const t = useTranslations()

  const { execute, isPending } = useAction(refreshAllChannelTokensAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        return
      }
      if (data.failed > 0) {
        toast.warning(
          t("channels.refreshAllTokens.resultWithFailures", {
            refreshed: data.refreshed,
            failed: data.failed,
          }),
        )
      } else {
        toast.success(
          t("channels.refreshAllTokens.resultSuccess", {
            refreshed: data.refreshed,
          }),
        )
      }
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError)
      }
    },
  })

  return (
    <button
      {...rest}
      ref={ref}
      disabled={isPending}
      onClick={() => execute()}
      type="button"
    >
      {isPending ? (
        <Loader2Icon aria-hidden className="animate-spin" />
      ) : (
        <RefreshCwIcon aria-hidden />
      )}
      {t("channels.refreshAllTokens.button")}
    </button>
  )
}
