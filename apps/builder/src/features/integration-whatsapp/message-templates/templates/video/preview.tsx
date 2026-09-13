import { useTranslations } from "next-intl"
import { memo, useCallback } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import FileDropzone from "@/components/file-dropzone"
import { ButtonGroupPreview } from "../button/preview"
import { TemplateBody } from "../components/body"
import { TemplateFooter } from "../components/footer"

type TemplateVideoPreviewComponentProps = {
  parentName?: string
  minButtons?: number
  maxButtons?: number
}

const TemplateVideoPreviewComponent = (
  props: TemplateVideoPreviewComponentProps,
) => {
  const {
    parentName = "content",
    minButtons = 0,
    maxButtons = 3,
    ...rest
  } = props

  const t = useTranslations()
  const { register, unregister, control, setValue } = useFormContext()
  const showFooter = useWatch({
    control,
    name: `${parentName}.showFooter`,
  })

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
                uploadKeyName: "actions.uploadVideo",
                accept: {
                  "video/mp4": [".mp4"],
                },
                isCard: true,
                containerClassName: "aspect-video min-h-[120px] max-h-[240px]",
              }}
              onDrop={handleDrop}
              onRemove={handleRemove}
              parentName={`${parentName}.header`}
              register={register}
              type="video"
              unregister={unregister}
            />
          )}
        />
      </div>
      <TemplateBody parentName={`${parentName}.body`} />
      {showFooter && <TemplateFooter parentName={parentName} />}
      <hr />
      <ButtonGroupPreview
        max={maxButtons}
        min={minButtons}
        parentName={`${parentName}.buttons`}
      />
    </div>
  )
}

export const TemplateVideoPreview = memo(TemplateVideoPreviewComponent)
