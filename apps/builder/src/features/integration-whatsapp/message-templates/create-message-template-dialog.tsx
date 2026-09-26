"use client"

import { whatsappTemplateCategories } from "@chatbotx.io/database/partials"
import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SelectField } from "@chatbotx.io/ui/components/form/select-field"
import { Badge } from "@chatbotx.io/ui/components/ui/badge"
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
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  CopyIcon,
  FileTextIcon,
  InfoIcon,
  LinkIcon,
  Loader2Icon,
  LockIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ComponentType, memo, useEffect, useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { createMessageTemplateAction } from "@/features/integration-whatsapp/message-templates/actions/create-message-template.action"
import { editMessageTemplateAction } from "@/features/integration-whatsapp/message-templates/actions/edit-message-template.action"
import { WhatsappMessageTemplateCategorySelect } from "@/features/integration-whatsapp/message-templates/components/category-select"
import { WhatsappMessageTemplateLanguageSelect } from "@/features/integration-whatsapp/message-templates/components/language-select"
import {
  createMessageTemplateRequest,
  editMessageTemplateRequest,
} from "@/features/integration-whatsapp/message-templates/schema/mutation"
import { WhatsappTemplateDialogProvider } from "./context"
import type { WhatsappMessageTemplateResource } from "./schema/resource"
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
import { metaComponentsToFormValues } from "./utils/parse-meta-to-form"

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
// Inline helper components
// ---------------------------------------------------------------------------

function NameFieldWithCounter() {
  const t = useTranslations()
  const { watch } = useFormContext()
  const nameValue = watch("name") || ""
  return (
    <InputField
      description={`${t("whatsapp.messageTemplate.nameHint")} · ${nameValue.length}/512`}
      label={t("fields.name.label")}
      name="name"
      pattern="[a-z0-9_]+"
      placeholder="order_shipping_update"
      required
    />
  )
}

function LanguageMismatchWarning() {
  const t = useTranslations()
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <p className="text-xs leading-relaxed">
        {t("whatsapp.messageTemplate.languageMismatch")}
      </p>
    </div>
  )
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
  const bodyVariables = useWatch({
    control,
    name: `${parentName}.body.variables`,
  })
  const footer = useWatch({ control, name: `${parentName}.footer` })
  const buttons = useWatch({ control, name: `${parentName}.buttons` })

  const isMedia =
    templateType === templateTypes.enum.Image ||
    templateType === templateTypes.enum.Video ||
    templateType === templateTypes.enum.Document
  const isCarousel =
    templateType === templateTypes.enum.CarouselImage ||
    templateType === templateTypes.enum.CarouselVideo

  const hasBody = typeof bodyText === "string" && bodyText.length > 0

  // Substitute sample values into body text for preview
  const previewBody = useMemo(() => {
    if (!hasBody) {
      return ""
    }
    let text = bodyText as string
    if (Array.isArray(bodyVariables)) {
      for (let i = 0; i < bodyVariables.length; i++) {
        const sample = bodyVariables[i]
        if (sample) {
          text = text.replace(`{{${i + 1}}}`, sample)
        }
      }
    }
    return text
  }, [bodyText, bodyVariables, hasBody])

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
        <div className="-mx-2.5 -mt-2.5 mb-2 flex aspect-[4/3] max-h-44 items-center justify-center overflow-hidden rounded-t-lg bg-zinc-200 dark:bg-zinc-700">
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
                <div className="relative h-full w-full">
                  <video
                    className="h-full w-full object-cover"
                    muted
                    src={filePreviewUrl}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircleIcon className="size-10 text-white drop-shadow-lg" />
                  </div>
                </div>
              )
            }
            if (
              headerFile instanceof File &&
              templateType === templateTypes.enum.Document
            ) {
              return (
                <div className="flex flex-col items-center gap-1.5 px-4">
                  <FileTextIcon className="size-8 text-zinc-500 dark:text-zinc-400" />
                  <span className="max-w-full truncate text-center text-[11px] text-zinc-600 dark:text-zinc-300">
                    {headerFile.name}
                  </span>
                </div>
              )
            }
            return (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl opacity-40">{mediaEmoji}</span>
                <span className="text-[10px] text-zinc-400">
                  {t("actions.selectFile")}
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {/* Carousel placeholder */}
      {isCarousel && (
        <div className="-mx-2.5 -mt-2.5 mb-2 flex h-28 items-center justify-center gap-2 rounded-t-lg bg-zinc-200 px-3 dark:bg-zinc-700">
          {[1, 2, 3].map((i) => (
            <div
              className="flex h-20 w-14 items-center justify-center rounded bg-zinc-300 shadow-sm dark:bg-zinc-600"
              key={i}
            >
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {i}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Header text (text-type templates only) */}
      {!(isMedia || isCarousel) &&
        typeof headerText === "string" &&
        headerText.length > 0 && (
          <p className="mb-1 font-bold text-[13px] leading-snug dark:text-zinc-100">
            {headerText}
          </p>
        )}

      {/* Body */}
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed dark:text-zinc-200">
        {hasBody ? (
          previewBody
        ) : (
          <span className="italic opacity-40">
            {t("whatsapp.messageTemplate.startTyping")}
          </span>
        )}
      </p>

      {/* Footer */}
      {typeof footer === "string" && footer.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {footer}
        </p>
      )}

      {/* Buttons */}
      {Array.isArray(buttons) && buttons.length > 0 && (
        <div className="-mx-2.5 mt-2 -mb-2.5 flex flex-col border-zinc-200 border-t dark:border-zinc-600">
          {(
            buttons as Array<{
              text?: string
              type?: string
              url?: string
              urlDynamic?: boolean
              example?: string
            }>
          ).map((btn, i: number) => (
            <div
              className="flex items-center justify-center gap-1.5 border-zinc-200 border-b py-2 text-center font-medium text-[#00a5f4] text-[13px] last:border-b-0 dark:border-zinc-600"
              // biome-ignore lint/suspicious/noArrayIndexKey: buttons have no stable ID
              key={`btn-${i}`}
            >
              {btn?.type === "url" && <LinkIcon className="size-3 shrink-0" />}
              {btn?.type === "copyCode" && (
                <CopyIcon className="size-3 shrink-0" />
              )}
              {btn?.text || "•••"}
            </div>
          ))}
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
  const [templateType, setTemplateType] = useState<TemplateType>(
    templateTypes.enum.Text,
  )

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
          setTemplateType(templateTypes.enum.Text)
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
          category: "MARKETING",
          // biome-ignore lint/suspicious/noExplicitAny: template type discriminated union
          templateType: templateTypes.enum.Text as any,
          content: templateTextDefaultValue(),
        },
      },
      errorMapProps: {},
    },
  )

  const templateTypeOptions = useMemo(
    () => [
      {
        label: t("whatsapp.messageTemplate.text.label"),
        value: templateTypes.enum.Text,
      },
      {
        label: t("whatsapp.messageTemplate.image.label"),
        value: templateTypes.enum.Image,
      },
      {
        label: t("whatsapp.messageTemplate.video.label"),
        value: templateTypes.enum.Video,
      },
      {
        label: t("whatsapp.messageTemplate.document.label"),
        value: templateTypes.enum.Document,
      },
      {
        label: t("whatsapp.messageTemplate.carouselImage.label"),
        value: templateTypes.enum.CarouselImage,
      },
      {
        label: t("whatsapp.messageTemplate.carouselVideo.label"),
        value: templateTypes.enum.CarouselVideo,
      },
      {
        label: t("whatsapp.messageTemplate.viewCatalog.label"),
        value: templateTypes.enum.ViewCatalog,
      },
      {
        label: t("whatsapp.messageTemplate.viewProduct.label"),
        value: templateTypes.enum.ViewProduct,
      },
    ],
    [t],
  )

  const onSelectTemplateType = (type: TemplateType) => {
    setTemplateType(type)
    // biome-ignore lint/suspicious/noExplicitAny: template type discriminated union
    setValue("templateType", type as any)
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
      case templateTypes.enum.CarouselImage: {
        const carouselImageDefaults = templateCarouselImageDefaultValue()
        const carouselImageBtnText = t(
          "whatsapp.messageTemplate.defaultButtonText",
          { index: 1 },
        )
        for (const card of carouselImageDefaults.cards) {
          for (const btn of card.buttons) {
            btn.text = carouselImageBtnText
          }
        }
        setValue("content", carouselImageDefaults)
        break
      }
      case templateTypes.enum.CarouselVideo: {
        const carouselVideoDefaults = templateCarouselVideoDefaultValue()
        const carouselVideoBtnText = t(
          "whatsapp.messageTemplate.defaultButtonText",
          { index: 1 },
        )
        for (const card of carouselVideoDefaults.cards) {
          for (const btn of card.buttons) {
            btn.text = carouselVideoBtnText
          }
        }
        setValue("content", carouselVideoDefaults)
        break
      }
      case templateTypes.enum.ViewCatalog: {
        const catalogDefaults = templateCatalogDefaultValue()
        catalogDefaults.buttons[0].text = t(
          "whatsapp.messageTemplate.defaultViewCatalog",
        )
        setValue("content", catalogDefaults)
        break
      }
      case templateTypes.enum.ViewProduct: {
        const productDefaults = templateProductDefaultValue()
        productDefaults.buttons[0].text = t(
          "whatsapp.messageTemplate.defaultViewItems",
        )
        setValue("content", productDefaults)
        break
      }
      default:
        break
    }
  }

  const PartialComponent = partials[templateType]
  const PreviewComponent = previews[templateType]

  return (
    <WhatsappTemplateDialogProvider
      integrationWhatsappId={integrationWhatsappId}
      workspaceId={workspaceId}
    >
      <Form {...form}>
        <form
          className="flex h-full flex-col overflow-hidden"
          onSubmit={handleSubmitWithAction}
        >
          {/* ---- Fixed header bar ---- */}
          <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} size="sm" type="button" variant="ghost">
                <ArrowLeftIcon className="size-4" />
                {t("actions.back")}
              </Button>
              <h2 className="font-semibold text-lg">
                {t("whatsapp.messageTemplate.createTitle")}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {form.formState.isDirty &&
                !form.formState.isValid &&
                !form.formState.isSubmitting && (
                  <span className="flex items-center gap-1.5 text-destructive text-xs">
                    <AlertCircleIcon className="size-3.5" />
                    {t("whatsapp.messageTemplate.formHasErrors")}
                  </span>
                )}
              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                size="sm"
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {t("whatsapp.messageTemplate.submitForReview")}
              </Button>
            </div>
          </div>

          {/* ---- Single-step layout: inputs (start) + preview (end) ---- */}
          <div className="flex flex-1 overflow-hidden">
            {/* Inputs — renders first; in RTL this becomes the right side */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              {/* Template details */}
              <Card>
                <CardContent className="flex flex-col gap-4 py-4">
                  <NameFieldWithCounter />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField
                      label={t("fields.type.label")}
                      name="templateType"
                      options={templateTypeOptions}
                      required
                      triggerValueChange={(value) => {
                        if (value) {
                          onSelectTemplateType(value as TemplateType)
                        }
                      }}
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
                  </div>
                  <LanguageMismatchWarning />
                </CardContent>
              </Card>

              {/* Template content editor (body, header, footer, buttons, files) */}
              {PreviewComponent && (
                <Card>
                  <CardContent className="py-4">
                    <PreviewComponent parentName="content" />
                  </CardContent>
                </Card>
              )}

              {/* Template options (toggles, variable sample values) */}
              {PartialComponent && (
                <Card>
                  <CardContent className="py-4">
                    <PartialComponent parentName="content" />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview — renders second; in RTL this becomes the left side */}
            <div className="hidden w-[420px] shrink-0 items-start justify-center overflow-y-auto border-s bg-muted/40 p-6 lg:flex">
              <PhoneFrame subtitle={t("whatsapp.messageTemplate.preview")}>
                <LivePreview parentName="content" templateType={templateType} />
              </PhoneFrame>
            </div>
          </div>
        </form>
      </Form>
    </WhatsappTemplateDialogProvider>
  )
}

// ---------------------------------------------------------------------------
// Edit mode — re-uses the same layout, but locks immutable fields
// ---------------------------------------------------------------------------

function EditMessageTemplateDialogContent({
  workspaceId,
  integrationWhatsappId,
  template,
  onClose,
  onSuccess,
}: {
  workspaceId: string
  integrationWhatsappId: string
  template: WhatsappMessageTemplateResource
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations()

  // Infer template type from stored components (fallback to Text)
  // Exclude "Location" — not supported in the edit schema
  const inferredType = useMemo((): Exclude<TemplateType, "Location"> => {
    // biome-ignore lint/suspicious/noExplicitAny: stored Meta components
    const components = template.components as any[]
    if (!Array.isArray(components)) {
      return templateTypes.enum.Text
    }
    // biome-ignore lint/suspicious/noExplicitAny: stored Meta components
    const header = components.find((c: any) => c.type === "HEADER")
    if (header?.format === "IMAGE") {
      return templateTypes.enum.Image
    }
    if (header?.format === "VIDEO") {
      return templateTypes.enum.Video
    }
    if (header?.format === "DOCUMENT") {
      return templateTypes.enum.Document
    }
    return templateTypes.enum.Text
  }, [template.components])

  // Parse stored Meta components back to form values
  const parsedContent = useMemo(
    () =>
      metaComponentsToFormValues(
        template.components as Record<string, unknown>[],
        inferredType,
      ),
    [template.components, inferredType],
  )

  const { form, handleSubmitWithAction } = useHookFormAction(
    editMessageTemplateAction.bind(null, workspaceId, integrationWhatsappId),
    zodResolver(editMessageTemplateRequest),
    {
      actionProps: {
        onSuccess: () => {
          toast.success(
            t("messages.updatedSuccess", {
              feature: t("whatsapp.messageTemplate.label"),
            }),
          )
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
          templateId: template.id,
          name: template.name,
          language: template.language,
          category: template.category,
          // biome-ignore lint/suspicious/noExplicitAny: discriminated union default
          templateType: inferredType as any,
          content: parsedContent ?? {
            hideHeader: true,
            showFooter: true,
            footer: "",
            header: { text: "", variables: [] },
            body: { text: "", variables: [] },
            buttons: [],
          },
        },
      },
      errorMapProps: {},
    },
  )

  const isApproved = template.status === "APPROVED"

  const PreviewComponent = previews[inferredType]
  const PartialComponent = partials[inferredType]

  return (
    <WhatsappTemplateDialogProvider
      integrationWhatsappId={integrationWhatsappId}
      workspaceId={workspaceId}
    >
      <Form {...form}>
        <form
          className="flex h-full flex-col overflow-hidden"
          onSubmit={handleSubmitWithAction}
        >
          {/* ---- Fixed header bar ---- */}
          <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} size="sm" type="button" variant="ghost">
                <ArrowLeftIcon className="size-4" />
                {t("actions.back")}
              </Button>
              <h2 className="font-semibold text-lg">
                {t("whatsapp.messageTemplate.editTitle")}
              </h2>
              <Badge
                className={
                  isApproved
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }
                variant="secondary"
              >
                {t(
                  `whatsapp.messageTemplate.status.${template.status as "APPROVED" | "PENDING" | "REJECTED"}`,
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {form.formState.isDirty &&
                !form.formState.isValid &&
                !form.formState.isSubmitting && (
                  <span className="flex items-center gap-1.5 text-destructive text-xs">
                    <AlertCircleIcon className="size-3.5" />
                    {t("whatsapp.messageTemplate.formHasErrors")}
                  </span>
                )}
              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                size="sm"
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {t("whatsapp.messageTemplate.submitForReview")}
              </Button>
            </div>
          </div>

          {/* ---- Two-column layout: inputs (start) + preview (end) ---- */}
          <div className="flex flex-1 overflow-hidden">
            {/* Inputs — renders first; in RTL this becomes the right side */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              {/* Re-review notice for approved templates */}
              {isApproved && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    {t("whatsapp.messageTemplate.editApprovedNotice")}
                  </p>
                </div>
              )}

              {/* Template details — locked fields */}
              <Card>
                <CardContent className="flex flex-col gap-4 py-4">
                  <div className="relative">
                    <InputField
                      disabled
                      label={t("fields.name.label")}
                      name="name"
                      required
                    />
                    <LockIcon className="absolute end-3 top-9 size-3.5 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <WhatsappMessageTemplateLanguageSelect
                        disabled
                        label={t("fields.language.label")}
                        name="language"
                      />
                      <LockIcon className="absolute end-3 top-9 size-3.5 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <WhatsappMessageTemplateCategorySelect
                        disabled
                        label={t("fields.category.label")}
                        name="category"
                      />
                      <LockIcon className="absolute end-3 top-9 size-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <LockIcon className="size-3" />
                    {t("whatsapp.messageTemplate.lockedField")}
                  </p>
                </CardContent>
              </Card>

              {/* Media edit hint */}
              {(inferredType === templateTypes.enum.Image ||
                inferredType === templateTypes.enum.Video ||
                inferredType === templateTypes.enum.Document) && (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-blue-700 text-sm dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                  <InfoIcon className="size-4 shrink-0" />
                  {t("whatsapp.messageTemplate.mediaKeptHint")}
                </div>
              )}

              {/* Template content editor */}
              {PreviewComponent && (
                <Card>
                  <CardContent className="py-4">
                    <PreviewComponent parentName="content" />
                  </CardContent>
                </Card>
              )}

              {/* Template options */}
              {PartialComponent && (
                <Card>
                  <CardContent className="py-4">
                    <PartialComponent parentName="content" />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview — renders second; in RTL this becomes the left side */}
            <div className="hidden w-[420px] shrink-0 items-start justify-center overflow-y-auto border-s bg-muted/40 p-6 lg:flex">
              <PhoneFrame subtitle={t("whatsapp.messageTemplate.preview")}>
                <LivePreview parentName="content" templateType={inferredType} />
              </PhoneFrame>
            </div>
          </div>
        </form>
      </Form>
    </WhatsappTemplateDialogProvider>
  )
}

export const EditMessageTemplateDialog = memo(
  function EditMessageTemplateDialog({
    workspaceId,
    integrationWhatsappId,
    template,
  }: {
    workspaceId: string
    integrationWhatsappId: string
    template: WhatsappMessageTemplateResource
  }) {
    const t = useTranslations()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger
          render={
            <Button size="icon" title={t("actions.edit")} variant="ghost">
              <PencilIcon className="size-4" />
            </Button>
          }
        />
        <SheetContent className="flex w-full max-w-full flex-col p-0 sm:max-w-full [&>.absolute]:hidden">
          {open && (
            <EditMessageTemplateDialogContent
              integrationWhatsappId={integrationWhatsappId}
              onClose={() => setOpen(false)}
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
              template={template}
              workspaceId={workspaceId}
            />
          )}
        </SheetContent>
      </Sheet>
    )
  },
)

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
