"use client"

import type * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"

import { cn } from "@chatbotx.io/ui/lib/utils"

/**
 * Curated palette of vibrant avatar background colors.
 * Inspired by Telegram's approach — distinct, accessible with white text,
 * works in both light and dark themes.
 */
const AVATAR_COLORS = [
  "#E17076", // red
  "#EE7A3B", // orange
  "#E5A64E", // amber
  "#7BC862", // green
  "#65AADD", // blue
  "#6EC1E4", // sky
  "#A695E7", // purple
  "#EE7AAE", // pink
  "#56B4A9", // teal
  "#D48CDA", // orchid
] as const

/**
 * Deterministic hash → color index from a string seed (name or ID).
 * Simple DJB2 hash for fast, stable, well-distributed results.
 */
function seedToColor(seed: string): string {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  /**
   * When provided, generates a deterministic background color from this
   * string (typically the user's name or ID). Text is rendered white.
   * Without it, the default muted background is used.
   */
  colorSeed?: string
}

function AvatarFallback({
  className,
  colorSeed,
  style,
  ...props
}: AvatarFallbackProps) {
  const colorStyle = colorSeed
    ? { backgroundColor: seedToColor(colorSeed), color: "#fff", ...style }
    : style

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full font-medium",
        !colorSeed && "bg-muted dark:bg-neutral-500",
        className,
      )}
      style={colorStyle}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, seedToColor }
