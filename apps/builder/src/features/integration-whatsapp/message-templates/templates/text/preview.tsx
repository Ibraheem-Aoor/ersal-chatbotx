import { memo } from "react"
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

  return (
    <div className="flex w-full flex-col gap-4" {...rest}>
      <TemplateHeader parentName={`${parentName}.header`} />
      <TemplateBody parentName={`${parentName}.body`} />
      <TemplateFooter parentName={parentName} />
      <hr />
      <ButtonGroupPreview parentName={`${parentName}.buttons`} />
    </div>
  )
}

export const TemplateTextPreview = memo(TemplateTextPreviewComponent)
