"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

/**
 * Inline theme switcher — renders three small icon buttons (light / dark /
 * system) instead of a nested DropdownMenu. Base UI forbids nesting a Menu
 * inside a Menu.Item, so the old nested-dropdown approach crashed with error
 * #31 after the Radix → Base UI migration.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations()

  const themes = [
    { value: "light", icon: Sun, label: t("theme.light") },
    { value: "dark", icon: Moon, label: t("theme.dark") },
    { value: "system", icon: Monitor, label: t("theme.system") },
  ] as const

  return (
    <div className="flex gap-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          aria-label={label}
          className="h-7 w-7"
          key={value}
          onClick={(e) => {
            e.stopPropagation()
            setTheme(value)
          }}
          size="icon"
          variant={theme === value ? "default" : "ghost"}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  )
}
