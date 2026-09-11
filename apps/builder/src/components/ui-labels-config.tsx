"use client"

import { UILabelsProvider } from "@chatbotx.io/ui/lib/ui-labels"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

export function UILabelsConfig({ children }: { children: ReactNode }) {
  const t = useTranslations("ui")

  return (
    <UILabelsProvider
      labels={{
        optional: t("optional"),
        close: t("close"),
        tags: t("tags"),
        selectedRows: (selected, total) =>
          t("selectedRows", { selected, total }),
        rowsPerPage: t("rowsPerPage"),
        pageOf: (page, pageCount) => t("pageOf", { page, pageCount }),
        firstPage: t("firstPage"),
        previousPage: t("previousPage"),
        nextPage: t("nextPage"),
        lastPage: t("lastPage"),
        noResults: t("noResults"),
      }}
    >
      {children}
    </UILabelsProvider>
  )
}
