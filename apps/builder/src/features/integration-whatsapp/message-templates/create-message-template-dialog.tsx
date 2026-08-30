"use client"

import { whatsappTemplateCategories } from "@chatbotx.io/database/partials"
import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Card, CardContent } from "@chatbotx.io/ui/components/ui/card"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@chatbotx.io/ui/components/ui/sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { ArrowLeftIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ComponentType, memo, useState } from "react"
import { toast } from "sonner"
import { createMessageTemplateAction } from "@/features/integration-whatsapp/message-templates/actions/create-message-template.action"
import { WhatsappMessageTemplateCategorySelect } from "@/features/integration-whatsapp/message-templates/components/category-select"
import { WhatsappMessageTemplateLanguageSelect } from "@/features/integration-whatsapp/message-templates/components/language-select"
import { WhatsappMessageTemplateTypeSelect } from "@/features/integration-whatsapp/message-templates/components/template-type-select"
import { createMessageTemplateRequest } from "@/features/integration-whatsapp/message-templates/schema/mutation"
import { TemplateCarouselImagePartial } from "./templates/carousel-image/partial"
import { TemplateCarouselImagePreview } from "./templates/carousel-image/preview"
import { templateCarouselImageDefaultValue } from "./templates/carousel-image/schema"
import { TemplateCarouselVideoPartial } from "./templates/carousel-video/partial"
import { TemplateCarouselVideoPreview } from "./templates/carousel-video/preview"
import { templateCarouselVideoDefaultValue } from "./templates/carousel-video/schema"
import { TemplateCatalogPartial } from "./templates/catalog/partial"
import { TemplateCatalogPreview } from "./templates/catalog/preview"
import { templateCatalogDefaultValue } from "./templates/catalog/schema"
import { TemplateDocumentPartial } from "./templates/document/partial"
import { TemplateDocumentPreview } from "./templates/document/preview"
import { templateDocumentDefaultValue } from "./templates/document/schema"
import { TemplateImagePartial } from "./templates/image/partial"
import { TemplateImagePreview } from "./templates/image/preview"
import { templateImageDefaultValue } from "./templates/image/schema"
import { TemplateProductPartial } from "./templates/product/partial"
import { TemplateProductPreview } from "./templates/product/preview"
import { templateProductDefaultValue } from "./templates/product/schema"
import { TemplateTextPartial } from "./templates/text/partial"
import { TemplateTextPreview } from "./templates/text/preview"
import { templateTextDefaultValue } from "./templates/text/schema"
import { TemplateVideoPartial } from "./templates/video/partial"
import { TemplateVideoPreview } from "./templates/video/preview"
import { templateVideoDefaultValue } from "./templates/video/schema"
import { type TemplateType, templateTypes } from "./type"

type PartialProps = { parentName: string }

const previews: Record<TemplateType, ComponentType<PartialProps> | undefined> =
  {
    [templateTypes.enum.Text]: TemplateTextPreview,
    [templateTypes.enum.Image]: TemplateImagePreview,
    [templateTypes.enum.Video]: TemplateVideoPreview,
    [templateTypes.enum.Document]: TemplateDocumentPreview,
    [templateTypes.enum.CarouselImage]: TemplateCarouselImagePreview,
    [templateTypes.enum.CarouselVideo]: TemplateCarouselVideoPreview,
    [templateTypes.enum.ViewCatalog]: TemplateCatalogPreview,
    [templateTypes.enum.ViewProduct]: TemplateProductPreview,
    [templateTypes.enum.Location]: undefined,
  }

const partials: Record<TemplateType, ComponentType<PartialProps> | undefined> =
  {
    [templateTypes.enum.Text]: TemplateTextPartial,
    [templateTypes.enum.Image]: TemplateImagePartial,
    [templateTypes.enum.Video]: TemplateVideoPartial,
    [templateTypes.enum.Document]: TemplateDocumentPartial,
    [templateTypes.enum.CarouselImage]: TemplateCarouselImagePartial,
    [templateTypes.enum.CarouselVideo]: TemplateCarouselVideoPartial,
    [templateTypes.enum.ViewCatalog]: TemplateCatalogPartial,
    [templateTypes.enum.ViewProduct]: TemplateProductPartial,
    [templateTypes.enum.Location]: undefined,
  }

function CreateMessageTemplateDialogContent({
  workspaceId,
  integrationWhatsappId,
  onSuccess,
}: {
  workspaceId: string
  integrationWhatsappId: string
  onSuccess: () => void
}) {
  const t = useTranslations()
  const [templateType, setTemplateType] = useState<TemplateType | null>(null)

  const {
    form,
    handleSubmitWithAction,
    resetFormAndAction,
    form: { setValue },
  } = useHookFormAction(
    createMessageTemplateAction.bind(null, workspaceId, integrationWhatsappId),
    zodResolver(createMessageTemplateRequest),
    {
      actionProps: {
        onSuccess: () => {
          toast.success(
            t("messages.createdSuccess", {
              feature: t("whatsapp.messageTemplate.label"),
            }),
          )
          setTemplateType(null)
          resetFormAndAction()
          onSuccess()
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError)
          }
        },
      },
      formProps: {
        mode: "onChange",
        defaultValues: {
          name: "",
          language: "en",
          category: "UTILITY",
          content: {
            footer: "",
            header: {
              text: "",
              variables: [],
            },
            body: {
              text: "",
              variables: [],
            },
            buttons: [],
          },
          templateType: undefined,
        },
      },
      errorMapProps: {},
    },
  )

  const onSelectTemplateType = (type: TemplateType) => {
    setTemplateType(type)
    // biome-ignore lint/suspicious/noExplicitAny: template type discriminated union
    setValue("templateType", type as any)
    setValue("name", "")
    setValue("category", whatsappTemplateCategories.enum.MARKETING)

    switch (type) {
      case templateTypes.enum.Text:
        setValue("content", templateTextDefaultValue())
        break
      case templateTypes.enum.Image:
        setValue("content", templateImageDefaultValue())
        break
      case templateTypes.enum.Video:
        setValue("content", templateVideoDefaultValue())
        break
      case templateTypes.enum.Document:
        setValue("content", templateDocumentDefaultValue())
        break
      case templateTypes.enum.CarouselImage:
        setValue("content", templateCarouselImageDefaultValue())
        break
      case templateTypes.enum.CarouselVideo:
        setValue("content", templateCarouselVideoDefaultValue())
        break
      case templateTypes.enum.ViewCatalog:
        setValue("content", templateCatalogDefaultValue())
        break
      case templateTypes.enum.ViewProduct:
        setValue("content", templateProductDefaultValue())
        break
      default:
        break
    }
  }

  const PartialComponent = templateType ? partials[templateType] : undefined
  const PreviewComponent = templateType ? previews[templateType] : undefined

  return (
    <Form {...form}>
      <form
        className="flex h-full flex-col gap-4 overflow-y-auto"
        onSubmit={handleSubmitWithAction}
      >
        {!templateType && (
          <div className="p-2">
            <WhatsappMessageTemplateTypeSelect
              onSelectTemplateType={onSelectTemplateType}
            />
          </div>
        )}
        {templateType && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <Button
              className="self-start"
              onClick={() => setTemplateType(null)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArrowLeftIcon className="size-4" />
              {t("actions.back")}
            </Button>
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-2">
              <div className="flex flex-col gap-4 overflow-y-auto">
                <Card>
                  <CardContent className="flex flex-col gap-4 py-4">
                    <InputField
                      description={t("whatsapp.messageTemplate.nameHint")}
                      label={t("fields.name.label")}
                      name="name"
                      pattern="[a-z0-9_]+"
                      placeholder="order_shipping_update"
                      required
                    />
                    <WhatsappMessageTemplateLanguageSelect
                      label={t("fields.language.label")}
                      name="language"
                      required
                    />
                    <WhatsappMessageTemplateCategorySelect
                      label={t("fields.category.label")}
                      name="category"
                      required
                    />
                    {PartialComponent && (
                      <PartialComponent parentName="content" />
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-center overflow-y-auto">
                <Card className="h-fit min-w-[300px] max-w-[400px] rounded bg-orange-100 p-6">
                  {PreviewComponent && (
                    <PreviewComponent parentName="content" />
                  )}
                </Card>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                onClick={() => setTemplateType(null)}
                type="button"
                variant="outline"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="animate-spin" />
                )}
                {t("actions.create")}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}

export const CreateMessageTemplateDialog = memo(
  function CreateMessageTemplateDialog({
    workspaceId,
    integrationWhatsappId,
  }: {
    workspaceId: string
    integrationWhatsappId: string
  }) {
    const t = useTranslations()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger
          render={
            <Button size="sm">
              <PlusIcon className="size-4" />
              {t("actions.create")}
            </Button>
          }
        />
        <SheetContent className="flex w-full flex-col sm:max-w-2xl lg:max-w-4xl">
          <SheetHeader>
            <SheetTitle>{t("whatsapp.messageTemplate.createTitle")}</SheetTitle>
          </SheetHeader>
          {open && (
            <CreateMessageTemplateDialogContent
              integrationWhatsappId={integrationWhatsappId}
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
              workspaceId={workspaceId}
            />
          )}
        </SheetContent>
      </Sheet>
    )
  },
)
