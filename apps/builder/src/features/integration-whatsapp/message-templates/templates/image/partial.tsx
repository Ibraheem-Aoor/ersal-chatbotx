"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SwitchField } from "@chatbotx.io/ui/components/form/switch-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { useFormContext, useWatch } from "react-hook-form"

const VariableInput = memo(
  ({ index, parentName }: { index: number; parentName: string }) => {
    const t = useTranslations()

    return (
      <div className="mt-2 flex w-full gap-2">
        <Button variant="secondary">{`{{${index + 1}}}`}</Button>
        <div className="flex-1">
          <InputField
            name={`${parentName}.body.variables.${index}`}
            placeholder={t("actions.typeMessage")}
          />
        </div>
      </div>
    )
  },
)

const TemplateImagePartialComponent = (props: { parentName?: string }) => {
  const { parentName = "content", ...rest } = props

  const t = useTranslations()
  const { control } = useFormContext()

  const bodyVariables = useWatch({
    control,
    name: `${parentName}.body.variables`,
  })

  return (
    <div className="w-full flex-1" {...rest}>
      <div className="flex gap-4">
        <SwitchField
          label={t("whatsapp.showFooter.label")}
          name={`${parentName}.showFooter`}
        />
      </div>
      {bodyVariables.length > 0 && (
        <>
          <div className="mt-6">{t("whatsapp.sampleBodyContent.label")}</div>
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

export const TemplateImagePartial = memo(TemplateImagePartialComponent)
