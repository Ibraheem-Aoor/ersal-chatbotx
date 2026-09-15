import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Textarea } from "@chatbotx.io/ui/components/ui/textarea"
import { useTranslations } from "next-intl"
import { memo, useCallback, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useDebouncedCallback } from "use-debounce"

const TemplateBodyComponent = ({ parentName }: { parentName: string }) => {
  const t = useTranslations()
  const { getValues, setValue } = useFormContext()

  const [localBody, setLocalBody] = useState(
    () => getValues(`${parentName}.text`) || "",
  )

  const handleChange = useDebouncedCallback((value) => {
    setValue(`${parentName}.text`, value, { shouldValidate: true })
  }, 200)

  const processVariables = useDebouncedCallback((value: string) => {
    const variableMatches = value.match(/\{\{(\d+)\}\}/g) || []
    const values = getValues(`${parentName}.variables`)

    if (variableMatches.length === 0) {
      setValue(`${parentName}.variables`, [], { shouldValidate: true })
      return
    }

    const newValues: string[] = []

    let index = 1
    for (const match of variableMatches) {
      if (match === `{{${index}}}`) {
        index += 1
        newValues.push(values.length ? values.shift() : "")
      }
    }
    setValue(`${parentName}.variables`, newValues, { shouldValidate: true })
  }, 200)

  const onChangeValue = useCallback(
    (value: string) => {
      setLocalBody(value)
      handleChange(value)
      processVariables(value)
    },
    [handleChange, processVariables],
  )

  const addParam = useCallback(() => {
    const values = getValues(`${parentName}.variables`)
    const newBody = `${localBody} {{${values.length + 1}}}`
    setLocalBody(newBody)
    handleChange(newBody)
    setValue(`${parentName}.variables`, [...(values || []), ""], {
      shouldValidate: true,
    })
  }, [getValues, handleChange, localBody, parentName, setValue])

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
        {t("whatsapp.messageTemplate.sectionBody")}
      </span>
      <Textarea
        maxLength={1024}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={t("actions.enterText")}
        rows={4}
        value={localBody}
      />
      <div className="flex items-center justify-between">
        <Button
          className="text-xs"
          onClick={addParam}
          size="sm"
          type="button"
          variant="link"
        >
          {t("actions.addVariable")}
        </Button>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {localBody.length}/1024
        </span>
      </div>
    </div>
  )
}

export const TemplateBody = memo(TemplateBodyComponent)
