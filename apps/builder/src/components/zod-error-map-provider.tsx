"use client"

import { useLocale } from "next-intl"
import { useEffect } from "react"
import { config } from "zod"
import { ar, en } from "zod/locales"

/**
 * FORK PATCH: Arabic Zod validation messages.
 *
 * Uses Zod v4's built-in locale system (`config({ localeError })`) to set
 * Arabic validation messages when the app locale is "ar". For all other locales
 * Zod's default English messages apply.
 *
 * The built-in Arabic locale still leaks English type names ("string",
 * "number") inside messages like `too_small`. We patch those by wrapping the
 * locale's `localeError` and replacing known type-origin leaks with Arabic
 * equivalents.
 *
 * Rendered once in the root layout so every form picks up the translated
 * messages automatically — no per-form wiring needed.
 */

/** Map of English Zod type names to their Arabic equivalents */
const typeNameMap: Record<string, string> = {
  string: "نص",
  number: "رقم",
  bigint: "عدد كبير",
  date: "تاريخ",
  array: "قائمة",
  set: "مجموعة",
  file: "ملف",
}

/**
 * Replace any remaining English type names leaked by Zod's built-in Arabic
 * locale in error messages.
 */
function patchArTypeNames(message: string): string {
  let result = message
  for (const [enName, arName] of Object.entries(typeNameMap)) {
    // Replace "لـ string" → "لـ نص" (too_small pattern)
    result = result.replaceAll(`لـ ${enName}`, `لـ ${arName}`)
    // Replace "تكون string" → "تكون نص" (too_big pattern)
    result = result.replaceAll(`تكون ${enName}`, `تكون ${arName}`)
    // Replace "يكون string" → "يكون نص" (another pattern variant)
    result = result.replaceAll(`يكون ${enName}`, `يكون ${arName}`)
    // Replace "إدخال string" → "إدخال نص" (invalid_type pattern)
    result = result.replaceAll(`إدخال ${enName}`, `إدخال ${arName}`)
  }
  return result
}

export function ZodErrorMapProvider() {
  const locale = useLocale()

  useEffect(() => {
    if (locale === "ar") {
      const arLocale = ar()
      const originalLocaleError = arLocale.localeError
      config({
        localeError: (issue) => {
          const original = originalLocaleError(issue)
          // localeError returns a plain string in Zod v4
          if (typeof original === "string") {
            return patchArTypeNames(original)
          }
          return original
        },
      })
    } else {
      config(en())
    }
  }, [locale])

  return null
}
