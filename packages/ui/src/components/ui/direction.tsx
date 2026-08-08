"use client"

import { createContext, use, type ReactNode } from "react"

export type Direction = "ltr" | "rtl"

const DirectionContext = createContext<Direction>("ltr")

export function DirectionProvider({
  children,
  direction,
}: {
  children: ReactNode
  direction: Direction
}) {
  return (
    <DirectionContext value={direction}>{children}</DirectionContext>
  )
}

export function useDirection(): Direction {
  return use(DirectionContext)
}
