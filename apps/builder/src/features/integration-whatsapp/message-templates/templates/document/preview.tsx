import { useTranslations } from "next-intl"
import { memo, useCallback } from "react"
import { Controller, useFormContext } from "react-hook-form"
import FileDropzone from "@/components/file-dropzone"
import { ButtonGroupPreview } from "../button/preview"
import { TemplateBody } from "../components/body"
import { TemplateFooter } from "../components/footer"

type TemplateDocumentPreviewComponentProps = {
  parentName?: string
}

const TemplateDocumentPreviewComponent = (
  props: TemplateDocumentPreviewComponentProps,
) => {
  const { parentName = "content", ...rest } = props

  const t = useTranslations()
  const { register, unregister, control, setValue } = useFormContext()

  const handleRemove = useCallback(() => {
    setValue(`${parentName}.header.file`, null, {
      shouldValidate: true,
    })
  }, [parentName, setValue])

  const handleDrop = useCallback(
    (file: File) => {
      setValue(`${parentName}.header.file`, file, {
        shouldValidate: true,
      })
    },
    [parentName, setValue],
  )

  return (
    <div className="flex w-full flex-col gap-4" {...rest}>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
          {t("whatsapp.messageTemplate.sectionHeader")}
        </span>
        <Controller
          control={control}
          name={`${parentName}.header.file`}
          render={() => (
            <FileDropzone
              configs={{
                uploadKeyName: "actions.uploadDocument",
                accept: {
                  "application/pdf": [".pdf"],
                },
                maxSize: 100,
                isCard: true,
                containerClassName: "min-h-[100px]",
              }}
              onDrop={handleDrop}
              onRemove={handleRemove}
              parentName={`${parentName}.header`}
              register={register}
              type="file"
              unregister={unregister}
            />
          )}
        />
      </div>
      <TemplateBody parentName={`${parentName}.body`} />
      <TemplateFooter parentName={parentName} />
      <hr />
      <ButtonGroupPreview parentName={`${parentName}.buttons`} />
    </div>
  )
}

export const TemplateDocumentPreview = memo(TemplateDocumentPreviewComponent)
