"use client"

import { UiLocaleProvider } from "@chatbotx.io/ui/providers/ui-locale"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

/**
 * Bridges next-intl translations into the shared UI locale context.
 *
 * Reads from the `uiLocale` namespace in `messages/{locale}.json` and passes
 * the translated strings to `UiLocaleProvider` so every DataTable, Combobox,
 * MultiSelect, and ViewOptions component renders locale-aware labels without
 * needing individual prop overrides.
 */
export function UiLocaleSetup({ children }: { children: ReactNode }) {
  const t = useTranslations("uiLocale")

  return (
    <UiLocaleProvider
      labels={{
        dataTable: {
          selectedRows: (selected, total) =>
            t("dataTable.selectedRows", { selected, total }),
          rowsPerPage: t("dataTable.rowsPerPage"),
          pageOf: (page, pageCount) =>
            t("dataTable.pageOf", { page, pageCount }),
          firstPage: t("dataTable.firstPage"),
          previousPage: t("dataTable.previousPage"),
          nextPage: t("dataTable.nextPage"),
          lastPage: t("dataTable.lastPage"),
          noResults: t("dataTable.noResults"),
        },
        combobox: {
          search: t("combobox.search"),
          noRecordFound: t("combobox.noRecordFound"),
          pleaseSelect: t("combobox.pleaseSelect"),
        },
        viewOptions: {
          searchColumns: t("viewOptions.searchColumns"),
          noColumnsFound: t("viewOptions.noColumnsFound"),
          toggleColumns: t("viewOptions.toggleColumns"),
          view: t("viewOptions.view"),
        },
        multiSelect: {
          searchOptions: t("multiSelect.searchOptions"),
          noResultsFound: t("multiSelect.noResultsFound"),
          searchLabel: t("multiSelect.searchLabel"),
        },
      }}
    >
      {children}
    </UiLocaleProvider>
  )
}
