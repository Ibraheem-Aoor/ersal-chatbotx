"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * Default labels for shared UI components.
 *
 * Every component in `packages/ui` that shows user-facing text reads from this
 * context so the consuming app can inject translated strings from its own i18n
 * system (next-intl, react-intl, etc.) without the UI library needing a direct
 * dependency on any i18n framework.
 *
 * The defaults are English — the app overrides them for other locales.
 */
export type UiLocaleLabels = {
  dataTable: {
    selectedRows: (selected: number, total: number) => string
    rowsPerPage: string
    pageOf: (page: number, pageCount: number) => string
    firstPage: string
    previousPage: string
    nextPage: string
    lastPage: string
    noResults: string
  }
  combobox: {
    search: string
    noRecordFound: string
    pleaseSelect: string
  }
  viewOptions: {
    searchColumns: string
    noColumnsFound: string
    toggleColumns: string
    view: string
  }
  multiSelect: {
    searchOptions: string
    noResultsFound: string
    searchLabel: string
  }
}

const defaultLabels: UiLocaleLabels = {
  dataTable: {
    selectedRows: (selected, total) =>
      `${selected} of ${total} row(s) selected.`,
    rowsPerPage: "Rows per page",
    pageOf: (page, pageCount) => `Page ${page} of ${pageCount}`,
    firstPage: "Go to first page",
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    lastPage: "Go to last page",
    noResults: "No results.",
  },
  combobox: {
    search: "Search...",
    noRecordFound: "No record found.",
    pleaseSelect: "Please select...",
  },
  viewOptions: {
    searchColumns: "Search columns...",
    noColumnsFound: "No columns found.",
    toggleColumns: "Toggle columns",
    view: "View",
  },
  multiSelect: {
    searchOptions: "Search options...",
    noResultsFound: "No results found.",
    searchLabel: "Search through available options",
  },
}

const UiLocaleContext = createContext<UiLocaleLabels>(defaultLabels)

type UiLocaleProviderProps = {
  labels: Partial<UiLocaleLabels>
  children: ReactNode
}

/**
 * Wrap your app with this provider to inject locale-aware labels into all
 * shared UI components (DataTable, Combobox, MultiSelect, ViewOptions).
 *
 * Partial overrides are deep-merged with the English defaults so you only need
 * to supply the keys that differ.
 */
export function UiLocaleProvider({ labels, children }: UiLocaleProviderProps) {
  const merged: UiLocaleLabels = {
    dataTable: { ...defaultLabels.dataTable, ...labels.dataTable },
    combobox: { ...defaultLabels.combobox, ...labels.combobox },
    viewOptions: { ...defaultLabels.viewOptions, ...labels.viewOptions },
    multiSelect: { ...defaultLabels.multiSelect, ...labels.multiSelect },
  }

  return (
    <UiLocaleContext.Provider value={merged}>
      {children}
    </UiLocaleContext.Provider>
  )
}

/**
 * Hook for shared UI components to read locale-aware labels.
 * Falls back to English defaults when no provider is present.
 */
export function useUiLocale(): UiLocaleLabels {
  return useContext(UiLocaleContext)
}
