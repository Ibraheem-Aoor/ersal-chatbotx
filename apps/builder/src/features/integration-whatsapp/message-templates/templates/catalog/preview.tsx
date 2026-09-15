import { memo } from "react"
import { ButtonGroupPreview } from "../button/preview"
import { TemplateBody } from "../components/body"
import { TemplateFooter } from "../components/footer"

type TemplateCatalogPreviewComponentProps = {
  parentName: string
}

const TemplateCatalogPreviewComponent = (
  props: TemplateCatalogPreviewComponentProps,
) => {
  const { parentName = "content", ...rest } = props

  return (
    <div className="flex w-full flex-col gap-4" {...rest}>
      <TemplateBody parentName={`${parentName}.body`} />
      <TemplateFooter parentName={parentName} />
      <hr />
      <ButtonGroupPreview
        changeType={false}
        max={1}
        min={1}
        parentName={`${parentName}.buttons`}
      />
    </div>
  )
}

export const TemplateCatalogPreview = memo(TemplateCatalogPreviewComponent)
