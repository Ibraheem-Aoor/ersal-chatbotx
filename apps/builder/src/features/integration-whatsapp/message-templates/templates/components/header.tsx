import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Input } from "@chatbotx.io/ui/components/ui/input"
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
      const sanitized = value.replace(/[\n\r]/g, "")
      setLocalHeader(sanitized)
      handleChange(sanitized)
      processVariables(sanitized)
    },
    [handleChange, processVariables],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text")
      if (pasted.includes("\n") || pasted.includes("\r")) {
        e.preventDefault()
        const sanitized = pasted.replace(/[\n\r]/g, " ").trim()
        const input = e.currentTarget
        const start = input.selectionStart ?? localHeader.length
        const end = input.selectionEnd ?? localHeader.length
        const newValue =
          localHeader.slice(0, start) + sanitized + localHeader.slice(end)
        onChangeValue(newValue.slice(0, 60))
      }
    },
    [localHeader, onChangeValue],
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
      <Input
        maxLength={60}
        onChange={(e) => onChangeValue(e.target.value)}
        onPaste={handlePaste}
        placeholder={t("actions.enterText")}
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
