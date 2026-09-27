"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chatbotx.io/ui/components/ui/select"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { ButtonGroupPreview } from "../button/preview"
import { TemplateBody } from "../components/body"
import { TemplateFooter } from "../components/footer"
import { TemplateHeader } from "../components/header"

type TemplateTextPreviewComponentProps = {
  parentName?: string
}

const TemplateTextPreviewComponent = (
  props: TemplateTextPreviewComponentProps,
) => {
  const { parentName = "content", ...rest } = props
  const t = useTranslations()
  const { control, setValue } = useFormContext()
  const hideHeader = useWatch({ control, name: `${parentName}.hideHeader` })

  return (
    <div className="flex w-full flex-col gap-4" {...rest}>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
          {t("whatsapp.messageTemplate.sectionHeader")}
        </span>
        <Select
          onValueChange={(value) => {
            const showHeader = value === "text"
            setValue(`${parentName}.hideHeader`, showHeader, {
              shouldValidate: true,
            })
            if (!showHeader) {
              setValue(`${parentName}.header.text`, "", {
                shouldValidate: true,
              })
              setValue(`${parentName}.header.variables`, [], {
                shouldValidate: true,
              })
            }
          }}
          value={hideHeader ? "text" : "none"}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("whatsapp.messageTemplate.headerNone")}
            </SelectItem>
            <SelectItem value="text">
              {t("whatsapp.messageTemplate.headerText")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hideHeader && <TemplateHeader parentName={`${parentName}.header`} />}
      <TemplateBody parentName={`${parentName}.body`} />
      <TemplateFooter parentName={parentName} />
      <hr />
      <ButtonGroupPreview parentName={`${parentName}.buttons`} />
    </div>
  )
}

export const TemplateTextPreview = memo(TemplateTextPreviewComponent)
