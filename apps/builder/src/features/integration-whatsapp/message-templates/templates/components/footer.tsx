import { Textarea } from "@chatbotx.io/ui/components/ui/textarea"
import { useTranslations } from "next-intl"
import { memo, useCallback, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useDebouncedCallback } from "use-debounce"

const TemplateFooterComponent = ({ parentName }: { parentName: string }) => {
  const t = useTranslations()
  const { getValues, setValue } = useFormContext()

  const [localFooter, setLocalFooter] = useState(
    () => getValues(`${parentName}.footer`) || "",
  )

  const handleChange = useDebouncedCallback((value) => {
    setValue(`${parentName}.footer`, value, { shouldValidate: true })
  }, 200)

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalFooter(e.target.value)
      handleChange(e.target.value)
    },
    [handleChange],
  )

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
        {t("whatsapp.messageTemplate.sectionFooter")}
      </span>
      <Textarea
        maxLength={60}
        onChange={handleTextChange}
        placeholder={t("whatsapp.messageTemplate.footerPlaceholder")}
        rows={2}
        value={localFooter}
      />
      <div className="flex justify-end">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {localFooter.length}/60
        </span>
      </div>
    </div>
  )
}

export const TemplateFooter = memo(TemplateFooterComponent)
