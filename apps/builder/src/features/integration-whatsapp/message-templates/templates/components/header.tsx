import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Textarea } from "@chatbotx.io/ui/components/ui/textarea"
import { useTranslations } from "next-intl"
import { memo, useCallback, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useDebouncedCallback } from "use-debounce"

const TemplateHeaderComponent = ({ parentName }: { parentName: string }) => {
  const t = useTranslations()
  const { getValues, setValue } = useFormContext()

  const [localHeader, setLocalHeader] = useState(
    () => getValues(`${parentName}.text`) || "",
  )

  const handleChange = useDebouncedCallback((value) => {
    setValue(`${parentName}.text`, value, { shouldValidate: true })
  }, 200)

  const processVariables = useDebouncedCallback((value: string) => {
    if (!value.includes("{{1}}")) {
      setValue(`${parentName}.variables`, [], { shouldValidate: true })
      return
    }
    const values = getValues(`${parentName}.variables`)
    setValue(`${parentName}.variables`, values.length ? values : [""], {
      shouldValidate: true,
    })
  }, 200)

  const onChangeValue = useCallback(
    (value: string) => {
      setLocalHeader(value)
      handleChange(value)
      processVariables(value)
    },
    [handleChange, processVariables],
  )

  const addParam = useCallback(() => {
    const values = getValues(`${parentName}.variables`)
    if (values.length === 0) {
      const newHeader = `${localHeader} {{${values.length + 1}}}`
      setLocalHeader(newHeader)
      handleChange(newHeader)
      setValue(`${parentName}.variables`, [...(values || []), ""], {
        shouldValidate: true,
      })
    }
  }, [getValues, handleChange, localHeader, parentName, setValue])

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
        {t("whatsapp.messageTemplate.sectionHeader")}
      </span>
      <Textarea
        maxLength={60}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={t("actions.enterText")}
        rows={2}
        value={localHeader}
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
          {localHeader.length}/60
        </span>
      </div>
    </div>
  )
}

export const TemplateHeader = memo(TemplateHeaderComponent)
