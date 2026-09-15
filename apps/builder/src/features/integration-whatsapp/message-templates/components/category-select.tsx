"use client"

import { whatsappTemplateCategories } from "@chatbotx.io/database/partials"
import { SelectField } from "@chatbotx.io/ui/components/form/select-field"
import { InfoIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { templateTypes } from "../type"

export function WhatsappMessageTemplateCategorySelect({
  name,
  label,
  required = false,
  disabled = false,
}: {
  name: string
  label: string
  required?: boolean
  disabled?: boolean
}) {
  const t = useTranslations()
  const { watch } = useFormContext()
  const category = watch(name)
  const templateType = watch("templateType")
  const allowOptions = useMemo(() => {
    if (
      [templateTypes.enum.ViewCatalog, templateTypes.enum.ViewProduct].includes(
        templateType,
      )
    ) {
      return [whatsappTemplateCategories.enum.MARKETING]
    }

    return [
      whatsappTemplateCategories.enum.MARKETING,
      whatsappTemplateCategories.enum.UTILITY,
    ]
  }, [templateType])

  const options = useMemo(
    () =>
      [
        {
          label: t("whatsapp.category.marketing.label"),
          value: whatsappTemplateCategories.enum.MARKETING,
        },
        {
          label: t("whatsapp.category.utility.label"),
          value: whatsappTemplateCategories.enum.UTILITY,
        },
      ].filter((option) => allowOptions.includes(option.value)),
    [allowOptions, t],
  )

  let description: string | null = null
  if (category === whatsappTemplateCategories.enum.MARKETING) {
    description = t("whatsapp.category.marketing.description")
  } else if (category === whatsappTemplateCategories.enum.UTILITY) {
    description = t("whatsapp.category.utility.description")
  }

  return (
    <div className="flex flex-col gap-2">
      <SelectField
        disabled={disabled}
        label={label}
        name={name}
        options={options}
        placeholder={t("actions.pleaseSelect")}
        required={required}
      />
      {description && (
        <div className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-2 dark:bg-slate-800">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </span>
        </div>
      )}
    </div>
  )
}
