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
        reset: t("reset"),
        resetFilters: t("resetFilters"),
        previousSlide: t("previousSlide"),
        nextSlide: t("nextSlide"),
        selectOption: t("selectOption"),
        selectAll: t("selectAll"),
        clear: t("clear"),
        noResultsFound: t("noResultsFound"),
        pleaseSelect: t("pleaseSelect"),
        toggleColumns: t("toggleColumns"),
        view: t("view"),
        searchColumns: t("searchColumns"),
        noColumnsFound: t("noColumnsFound"),
      }}
    >
      {children}
    </UILabelsProvider>
  )
}
