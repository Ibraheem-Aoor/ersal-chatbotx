"use client"

import { createContext, useContext } from "react"

type WhatsappTemplateDialogContextValue = {
  workspaceId: string
  integrationWhatsappId: string
}

const WhatsappTemplateDialogContext =
  createContext<WhatsappTemplateDialogContextValue | null>(null)

export function WhatsappTemplateDialogProvider({
  workspaceId,
  integrationWhatsappId,
  children,
}: WhatsappTemplateDialogContextValue & { children: React.ReactNode }) {
  return (
    <WhatsappTemplateDialogContext.Provider
      value={{ workspaceId, integrationWhatsappId }}
    >
      {children}
    </WhatsappTemplateDialogContext.Provider>
  )
}

export function useWhatsappTemplateDialog() {
  const ctx = useContext(WhatsappTemplateDialogContext)
  if (!ctx) {
    throw new Error(
      "useWhatsappTemplateDialog must be used within WhatsappTemplateDialogProvider",
    )
  }
  return ctx
}
