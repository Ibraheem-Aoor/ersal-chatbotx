"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SwitchField } from "@chatbotx.io/ui/components/form/switch-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { useFormContext, useWatch } from "react-hook-form"

const VariableInput = memo(
  ({
    index,
    parentName,
    type,
  }: {
    index: number
    parentName: string
    type: "header" | "body"
  }) => {
    const t = useTranslations()

    return (
      <div className="mt-2 flex w-full gap-2">
        <Button variant="secondary">{`{{${index + 1}}}`}</Button>
        <div className="flex-1">
          <InputField
            label={type === "body" ? "" : undefined}
            name={`${parentName}.${type}.variables.${index}`}
            placeholder={t("actions.typeMessage")}
          />
        </div>
      </div>
    )
  },
)

const TemplateProductPartialComponent = (props: { parentName?: string }) => {
  const { parentName = "content", ...rest } = props

  const t = useTranslations()
  const { control } = useFormContext()

  const [headerVariables, bodyVariables] = useWatch({
    control,
    name: [`${parentName}.header.variables`, `${parentName}.body.variables`],
  })

  return (
    <div className="w-full flex-1" {...rest}>
      <div className="flex gap-4">
        <SwitchField
          label={t("whatsapp.showFooter.label")}
          name={`${parentName}.showFooter`}
        />
      </div>
      {headerVariables.length > 0 && (
        <>
          <div className="mt-6">{t("whatsapp.sampleHeaderContent.label")}</div>
          {headerVariables.map((_variable: string, index: number) => (
            <VariableInput
              index={index}
              // biome-ignore lint/suspicious/noArrayIndexKey: wip
              key={`${parentName}-header-variable-${index}`}
              parentName={parentName}
              type="header"
            />
          ))}
        </>
      )}
      {bodyVariables.length > 0 && (
        <>
          <div className="mt-6">{t("whatsapp.sampleBodyContent.label")}</div>
          {bodyVariables.map((_variable: string, index: number) => (
            <VariableInput
              index={index}
              // biome-ignore lint/suspicious/noArrayIndexKey: wip
              key={`${parentName}-body-variable-${index}`}
              parentName={parentName}
              type="body"
            />
          ))}
        </>
      )}
    </div>
  )
}

export const TemplateProductPartial = memo(TemplateProductPartialComponent)
