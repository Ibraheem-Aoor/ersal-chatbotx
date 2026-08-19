"use client"

import { useLocale } from "next-intl"
import { useEffect } from "react"
import { config } from "zod"

/**
 * FORK PATCH: Arabic Zod validation messages.
 *
 * Uses Zod v4's built-in locale system (`config({ localeError })`) to set
 * Arabic validation messages when the app locale is "ar". For all other locales
 * Zod's default English messages apply.
 *
 * Rendered once in the root layout so every form picks up the translated
 * messages automatically — no per-form wiring needed.
 */
export function ZodErrorMapProvider() {
  const locale = useLocale()

  useEffect(() => {
    if (locale === "ar") {
      import("zod/locales").then((locales) => {
        config(locales.ar())
      })
    } else {
      import("zod/locales").then((locales) => {
        config(locales.en())
      })
    }
  }, [locale])

  return null
}
