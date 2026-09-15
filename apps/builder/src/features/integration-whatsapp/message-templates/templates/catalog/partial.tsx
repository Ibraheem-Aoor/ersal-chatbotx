"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { useFormContext, useWatch } from "react-hook-form"

const VariableInput = memo(
  ({ parentName, index }: { parentName: string; index: number }) => {
    const t = useTranslations()

    return (
      <div className="mt-2 flex w-full gap-2">
        <Button type="button" variant="secondary">{`{{${index + 1}}}`}</Button>
        <div className="flex-1">
          <InputField
            name={`${parentName}.body.variables.${index}`}
            placeholder={t("whatsapp.messageTemplate.samplePlaceholder")}
          />
        </div>
      </div>
    )
  },
)

const TemplateCatalogPartialComponent = (props: { parentName?: string }) => {
  const { parentName = "content", ...rest } = props
  const t = useTranslations()
  const { control } = useFormContext()

  const bodyVariables = useWatch({
    control,
    name: `${parentName}.body.variables`,
  })

  return (
    <div className="w-full flex-1" {...rest}>
      {bodyVariables?.length > 0 && (
        <>
          <div className="font-medium text-sm">
            {t("whatsapp.sampleBodyCardContent.label")}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("whatsapp.messageTemplate.sampleValuesHint")}
          </p>
          {bodyVariables.map((_variable: string, index: number) => (
            <VariableInput
              index={index}
              // biome-ignore lint/suspicious/noArrayIndexKey: wip
              key={`${parentName}-variable-${index}`}
              parentName={parentName}
            />
          ))}
        </>
      )}
    </div>
  )
}

export const TemplateCatalogPartial = memo(TemplateCatalogPartialComponent)
