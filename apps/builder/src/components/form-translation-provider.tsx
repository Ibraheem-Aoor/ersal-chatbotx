"use client"

import { FormMessageTranslatorProvider } from "@chatbotx.io/ui/components/ui/form"
import { useTranslations } from "next-intl"
import { type ReactNode, useCallback } from "react"

const I18N_KEY_RE = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/

export function FormTranslationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations()

  const translate = useCallback(
    (message: string) => {
      if (!I18N_KEY_RE.test(message)) {
        return message
      }
      try {
        const result = t(message as Parameters<typeof t>[0])
        return typeof result === "string" ? result : message
      } catch {
        return message
      }
    },
    [t],
  )

  return (
    <FormMessageTranslatorProvider value={translate}>
      {children}
    </FormMessageTranslatorProvider>
  )
}
