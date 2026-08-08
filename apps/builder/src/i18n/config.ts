export const locales = ["ar", "en", "vi"] as const

export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "ar"

export const localeMeta: Record<
  Locale,
  { nativeLabel: string; dir: "ltr" | "rtl" }
> = {
  ar: { nativeLabel: "العربية", dir: "rtl" },
  en: { nativeLabel: "English", dir: "ltr" },
  vi: { nativeLabel: "Tiếng Việt", dir: "ltr" },
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function resolveLocale(value: string | undefined): Locale {
  if (!value) {
    return defaultLocale
  }
  if (isLocale(value)) {
    return value
  }

  const language = value.split("-")[0]
  if (!language) {
    return defaultLocale
  }

  return (
    locales.find((locale) => locale.split("-")[0] === language) ?? defaultLocale
  )
}
