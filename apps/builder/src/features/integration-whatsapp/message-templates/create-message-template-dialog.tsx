"use client"

import { whatsappTemplateCategories } from "@chatbotx.io/database/partials"
import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Card, CardContent } from "@chatbotx.io/ui/components/ui/card"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@chatbotx.io/ui/components/ui/sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { ArrowLeftIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ComponentType, memo, useEffect, useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
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

// ---------------------------------------------------------------------------
// WhatsApp phone-frame preview — mirrors the Meta Business Suite style
// ---------------------------------------------------------------------------

function PhoneFrame({
  children,
  subtitle,
}: {
  children: React.ReactNode
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone bezel */}
      <div className="relative w-[340px] rounded-[2.5rem] border-[6px] border-zinc-800 bg-zinc-800 shadow-xl dark:border-zinc-600">
        {/* Notch */}
        <div className="mx-auto mt-1 h-5 w-28 rounded-full bg-zinc-900 dark:bg-zinc-700" />
        {/* Screen */}
        <div className="mx-1 mt-1 mb-2 flex h-[580px] flex-col overflow-hidden rounded-[2rem] bg-[#efeae2] dark:bg-[#0b141a]">
          {/* WhatsApp header bar */}
          <div className="flex items-center gap-2 bg-[#075e54] px-4 py-3 dark:bg-[#1f2c34]">
            <div className="size-8 rounded-full bg-white/20" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-white text-xs">WhatsApp</span>
              <span className="text-[10px] text-white/60">{subtitle}</span>
            </div>
          </div>
          {/* Chat area */}
          <div className="flex flex-1 flex-col justify-end overflow-y-auto p-3">
            <div className="w-full rounded-lg bg-white p-2.5 shadow-sm dark:bg-[#1f2c34]">
              {children}
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="mx-auto mt-1 mb-1 h-1 w-24 rounded-full bg-zinc-500" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-only live preview — watches form state, renders in the phone frame
// ---------------------------------------------------------------------------

function LivePreview({
  parentName = "content",
  templateType,
}: {
  parentName?: string
  templateType: TemplateType
}) {
  const t = useTranslations()
  const { control } = useFormContext()

  const headerText = useWatch({ control, name: `${parentName}.header.text` })
  const headerFile = useWatch({ control, name: `${parentName}.header.file` })
  const bodyText = useWatch({ control, name: `${parentName}.body.text` })
  const footer = useWatch({ control, name: `${parentName}.footer` })
  const buttons = useWatch({ control, name: `${parentName}.buttons` })
  const hideHeader = useWatch({ control, name: `${parentName}.hideHeader` })
  const showFooter = useWatch({ control, name: `${parentName}.showFooter` })

  const isMedia =
    templateType === templateTypes.enum.Image ||
    templateType === templateTypes.enum.Video ||
    templateType === templateTypes.enum.Document
  const isCarousel =
    templateType === templateTypes.enum.CarouselImage ||
    templateType === templateTypes.enum.CarouselVideo

  const hasBody = typeof bodyText === "string" && bodyText.length > 0

  // Build a preview URL for the uploaded file
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("")
  useEffect(() => {
    if (headerFile instanceof File) {
      const url = URL.createObjectURL(headerFile)
      setFilePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setFilePreviewUrl("")
  }, [headerFile])

  const mediaEmoji = useMemo(() => {
    if (templateType === templateTypes.enum.Image) {
      return "🖼️"
    }
    if (templateType === templateTypes.enum.Video) {
      return "🎬"
    }
    return "📄"
  }, [templateType])

  return (
    <div className="flex flex-col text-sm">
      {/* Media header — shows uploaded file or placeholder */}
      {isMedia && (
        <div className="-mx-2.5 -mt-2.5 mb-2 flex h-36 items-center justify-center overflow-hidden rounded-t-lg bg-zinc-200 dark:bg-zinc-700">
          {(() => {
            if (filePreviewUrl && templateType === templateTypes.enum.Image) {
              return (
                // biome-ignore lint/performance/noImgElement: blob preview URL not compatible with next/image
                // biome-ignore lint/correctness/useImageSize: dimensions handled by CSS object-cover
                <img
                  alt="Preview"
                  className="h-full w-full object-cover"
                  src={filePreviewUrl}
                />
              )
            }
            if (filePreviewUrl && templateType === templateTypes.enum.Video) {
              return (
                <video
                  className="h-full w-full object-cover"
                  muted
                  src={filePreviewUrl}
                />
              )
            }
            return <span className="text-3xl opacity-40">{mediaEmoji}</span>
          })()}
        </div>
      )}

      {/* Carousel placeholder */}
      {isCarousel && (
        <div className="-mx-2.5 -mt-2.5 mb-2 flex h-28 items-center justify-center gap-1.5 rounded-t-lg bg-zinc-200 px-3 dark:bg-zinc-700">
          {[1, 2, 3].map((i) => (
            <div
              className="h-20 w-14 rounded bg-zinc-300 dark:bg-zinc-600"
              key={i}
            />
          ))}
        </div>
      )}

      {/* Header text (text-type templates only) */}
      {!(isMedia || isCarousel || hideHeader) &&
        typeof headerText === "string" &&
        headerText.length > 0 && (
          <p className="mb-1 font-bold text-[13px] leading-snug dark:text-zinc-100">
            {headerText}
          </p>
        )}

      {/* Body */}
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed dark:text-zinc-200">
        {hasBody ? (
          bodyText
        ) : (
          <span className="italic opacity-40">
            {t("whatsapp.messageTemplate.startTyping")}
          </span>
        )}
      </p>

      {/* Footer */}
      {showFooter && typeof footer === "string" && footer.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {footer}
        </p>
      )}

      {/* Buttons */}
      {Array.isArray(buttons) && buttons.length > 0 && (
        <div className="-mx-2.5 mt-2 -mb-2.5 flex flex-col border-zinc-200 border-t dark:border-zinc-600">
          {(buttons as Array<{ text?: string }>).map(
            (btn: { text?: string }, i: number) => (
              <div
                className="border-zinc-200 border-b py-2 text-center font-medium text-[#00a5f4] text-[13px] last:border-b-0 dark:border-zinc-600"
                // biome-ignore lint/suspicious/noArrayIndexKey: buttons have no stable ID
                key={`btn-${i}`}
              >
                {btn?.text || "•••"}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content (inside the full-screen sheet)
// ---------------------------------------------------------------------------

function CreateMessageTemplateDialogContent({
  workspaceId,
  integrationWhatsappId,
  onClose,
  onSuccess,
}: {
  workspaceId: string
  integrationWhatsappId: string
  onClose: () => void
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
          language: "ar",
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
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmitWithAction}
      >
        {/* ---- Fixed header bar ---- */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={templateType ? () => setTemplateType(null) : onClose}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArrowLeftIcon className="size-4" />
              {t("actions.back")}
            </Button>
            <h2 className="font-semibold text-lg">
              {t("whatsapp.messageTemplate.createTitle")}
            </h2>
          </div>
          {templateType && (
            <Button
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              size="sm"
              type="submit"
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {t("actions.create")}
            </Button>
          )}
        </div>

        {/* ---- Step 1: Choose template type ---- */}
        {!templateType && (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-8">
            <div className="mb-6 text-center">
              <h3 className="font-semibold text-xl">
                {t("whatsapp.messageTemplate.selectType")}
              </h3>
            </div>
            <div className="w-full max-w-2xl">
              <WhatsappMessageTemplateTypeSelect
                onSelectTemplateType={onSelectTemplateType}
              />
            </div>
          </div>
        )}

        {/* ---- Step 2: Read-only preview (left) + All inputs (right) ---- */}
        {templateType && (
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Read-only phone preview */}
            <div className="hidden w-[420px] shrink-0 items-start justify-center overflow-y-auto border-e bg-muted/40 p-6 lg:flex">
              <PhoneFrame subtitle={t("whatsapp.messageTemplate.preview")}>
                <LivePreview parentName="content" templateType={templateType} />
              </PhoneFrame>
            </div>

            {/* RIGHT: All input fields */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
              {/* Template details */}
              <Card>
                <CardContent className="flex flex-col gap-5 py-5">
                  <InputField
                    description={t("whatsapp.messageTemplate.nameHint")}
                    label={t("fields.name.label")}
                    name="name"
                    pattern="[a-z0-9_]+"
                    placeholder="order_shipping_update"
                    required
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  </div>
                </CardContent>
              </Card>

              {/* Template content editor (body, header, footer, buttons, files) */}
              {PreviewComponent && (
                <Card>
                  <CardContent className="py-5">
                    <PreviewComponent parentName="content" />
                  </CardContent>
                </Card>
              )}

              {/* Template options (toggles, variable sample values) */}
              {PartialComponent && (
                <Card>
                  <CardContent className="py-5">
                    <PartialComponent parentName="content" />
                  </CardContent>
                </Card>
              )}
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
        {/* FORK PATCH: Full-screen sheet for Meta-style template editor.
            Preview on the left (phone frame), inputs on the right. */}
        {/* [&>.absolute]:hidden hides the built-in Sheet close (X) button —
            we use our own Back button in the header instead. */}
        <SheetContent className="flex w-full max-w-full flex-col p-0 sm:max-w-full [&>.absolute]:hidden">
          {open && (
            <CreateMessageTemplateDialogContent
              integrationWhatsappId={integrationWhatsappId}
              onClose={() => setOpen(false)}
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
