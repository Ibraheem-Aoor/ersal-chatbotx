"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * Common labels used by UI primitives (dialog close, optional marker, etc.)
 * that live outside the app-layer i18n system. The app provides translations
 * via <UILabelsProvider>; defaults are English.
 */
export type UILabels = {
  optional: string
  close: string
  tags: string
  selectedRows: (selected: number, total: number) => string
  rowsPerPage: string
  pageOf: (page: number, pageCount: number) => string
  firstPage: string
  previousPage: string
  nextPage: string
  lastPage: string
  noResults: string
  reset: string
  resetFilters: string
  previousSlide: string
  nextSlide: string
  selectOption: string
  selectAll: string
  clear: string
  noResultsFound: string
  pleaseSelect: string
  toggleColumns: string
  view: string
  searchColumns: string
  noColumnsFound: string
}

const defaults: UILabels = {
  optional: "(optional)",
  close: "Close",
  tags: "tags",
  selectedRows: (selected, total) =>
    `${selected} of ${total} row(s) selected.`,
  rowsPerPage: "Rows per page",
  pageOf: (page, pageCount) => `Page ${page} of ${pageCount}`,
  firstPage: "Go to first page",
  previousPage: "Go to previous page",
  nextPage: "Go to next page",
  lastPage: "Go to last page",
  noResults: "No results.",
  reset: "Reset",
  resetFilters: "Reset filters",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  selectOption: "Select option",
  selectAll: "Select All",
  clear: "Clear",
  noResultsFound: "No results found.",
  pleaseSelect: "Please select...",
  toggleColumns: "Toggle columns",
  view: "View",
  searchColumns: "Search columns...",
  noColumnsFound: "No columns found.",
}

const UILabelsContext = createContext<UILabels>(defaults)

export function UILabelsProvider({
  labels,
  children,
}: {
  labels: Partial<UILabels>
  children: ReactNode
}) {
  return (
    <UILabelsContext value={{ ...defaults, ...labels }}>
      {children}
    </UILabelsContext>
  )
}

export function useUILabels(): UILabels {
  return useContext(UILabelsContext)
}
