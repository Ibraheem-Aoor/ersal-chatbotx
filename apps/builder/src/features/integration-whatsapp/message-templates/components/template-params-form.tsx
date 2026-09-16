"use client"

import {
  extractParameterInfos,
  type ParameterInfo,
  type TemplateComponent,
  type WhatsappFlowFieldMapping,
} from "@chatbotx.io/flow-config"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import { Label } from "@chatbotx.io/ui/components/ui/label"
import { DirectUploadButton } from "@chatbotx.io/ui/components/uploader/direct-upload-button"
import ky from "ky"
import { FileIcon, ImageIcon, Pencil, VideoIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { TiptapEditorField } from "@/components/tiptap/tiptap-editor-field"
import { CreateCustomFieldDialog } from "@/features/custom-fields/create-custom-field"
import { CustomFieldSelect } from "@/features/custom-fields/custom-field-select"
import { useCustomFieldStore } from "@/features/custom-fields/provider/custom-field-store-context"
import { useWhatsappFlow } from "@/features/flows/react-flow/stores/whatsapp-flow-store-provider"
import type {
  GetWhatsappFlowScreensResponse,
  WhatsappFlowScreenResource,
} from "@/features/integration-whatsapp/flows/schema/query"
import { useWorkspaceId } from "@/hooks/routing"
import { buildFlowFieldMappings } from "../lib/build-flow-field-mappings"

type TemplateParamsFormProps = {
  components: TemplateComponent[]
  parentName: string
  enableMediaUpload?: boolean
}

function getFieldName(param: ParameterInfo, parentName: string): string {
  if (
    param.type === "button" &&
    param.cardIndex !== undefined &&
    param.buttonIndex !== undefined
  ) {
    return `${parentName}.carousel[${param.cardIndex}].button[${param.buttonIndex}]`
  }
  if (param.type === "carousel" && param.cardIndex !== undefined) {
    return `${parentName}.carousel[${param.cardIndex}]`
  }
  if (param.type === "button") {
    return `${parentName}.button[${param.buttonIndex}]`
  }
  if (param.type === "limited_time_offer") {
    return `${parentName}.limited_time_offer`
  }
  return `${parentName}.${param.type}[${param.index}]`
}

function ButtonParamField({
  param,
  fieldName,
}: {
  param: ParameterInfo
  fieldName: string
}) {
  const t = useTranslations()
  const { register } = useFormContext()

  switch (param.buttonSubType) {
    case "copy_code":
      return (
        <div className="space-y-1">
          <Label className="text-xs">
            {t("whatsapp.messageTemplate.params.couponCode")}
          </Label>
          <Input
            {...register(`${fieldName}.coupon_code`)}
            placeholder={t(
              "whatsapp.messageTemplate.params.couponCodePlaceholder",
            )}
          />
        </div>
      )
    case "quick_reply":
      return (
        <div className="space-y-1">
          <Label className="text-xs">
            {t("whatsapp.messageTemplate.params.quickReplyPayload")}
          </Label>
          <Input
            {...register(`${fieldName}.payload`)}
            placeholder={t(
              "whatsapp.messageTemplate.params.quickReplyPayloadPlaceholder",
            )}
          />
        </div>
      )
    case "flow":
      return <TemplateFlowFieldMappings fieldName={fieldName} param={param} />
    case "catalog":
      return (
        <div className="space-y-1">
          <Label className="text-xs">
            {t("whatsapp.messageTemplate.params.catalogProductId")}
          </Label>
          <Input
            {...register(`${fieldName}.thumbnail_product_retailer_id`)}
            placeholder={t(
              "whatsapp.messageTemplate.params.catalogProductIdPlaceholder",
            )}
          />
        </div>
      )
    default:
      return (
        <div className="grid grid-cols-[90px_18px_1fr] items-start gap-2">
          <div className="flex h-7 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xs">
            {`{{${param.paramName}}}`}
          </div>
          <div className="flex h-7 items-center justify-center text-muted-foreground">
            →
          </div>
          <TiptapEditorField
            channels={["whatsapp"]}
            name={`${fieldName}.text`}
            placeholder=""
            showEmojiPicker={false}
          />
        </div>
      )
  }
}

function TemplateFlowFieldMappings({
  fieldName,
  param,
}: {
  fieldName: string
  param: ParameterInfo
}) {
  const t = useTranslations()
  const workspaceId = useWorkspaceId()
  const { getValues, setValue, watch } = useFormContext()
  const whatsappFlows = useWhatsappFlow((s) => s.whatsappFlows)
  const loadingWhatsappFlows = useWhatsappFlow((s) => s.loadingWhatsappFlows)
  const getAllCustomFields = useCustomFieldStore(
    (state) => state.getAllCustomFields,
  )
  const [screens, setScreens] = useState<WhatsappFlowScreenResource[]>([])
  const [loadingScreens, setLoadingScreens] = useState(false)
  const [screenError, setScreenError] = useState(false)
  const [open, setOpen] = useState(false)

  const flow = useMemo(
    () =>
      whatsappFlows.find(
        (candidate) => candidate.sourceId === param.flowSourceId,
      ) ?? null,
    [param.flowSourceId, whatsappFlows],
  )

  const mappings =
    (watch(`${fieldName}.fieldMappings`) as WhatsappFlowFieldMapping[]) ?? []

  const handleCustomFieldCreated = useCallback(() => {
    getAllCustomFields()
  }, [getAllCustomFields])

  useEffect(() => {
    if (!(workspaceId && flow?.id)) {
      setScreens([])
      setScreenError(false)
      return
    }

    const fetchScreens = async () => {
      setLoadingScreens(true)
      setScreenError(false)
      try {
        const data = await ky
          .get<GetWhatsappFlowScreensResponse>(
            `/api/workspaces/${workspaceId}/whatsapp-flows/${flow.id}/screens`,
          )
          .json()
        setScreens(data.screens ?? [])
      } catch {
        setScreens([])
        setScreenError(true)
      } finally {
        setLoadingScreens(false)
      }
    }

    fetchScreens()
  }, [flow?.id, workspaceId])

  useEffect(() => {
    if (screens.length === 0) {
      return
    }

    const existing =
      (getValues(`${fieldName}.fieldMappings`) as
        | WhatsappFlowFieldMapping[]
        | undefined) ?? []

    setValue(
      `${fieldName}.fieldMappings`,
      buildFlowFieldMappings(screens, existing),
      {
        shouldDirty: false,
        shouldValidate: true,
      },
    )
  }, [fieldName, getValues, screens, setValue])

  if (!param.flowSourceId) {
    return null
  }

  const flowName = flow?.name ?? param.flowSourceId
  const startScreenLabel =
    screens.find((screen) => screen.id === param.navigateScreenId)?.title ??
    param.navigateScreenId ??
    "—"

  const renderMappingSection = () => {
    if (loadingWhatsappFlows || loadingScreens) {
      return (
        <p className="text-muted-foreground text-xs">
          {t("messages.loadingData")}
        </p>
      )
    }

    if (!flow) {
      return (
        <p className="text-muted-foreground text-xs">
          {t("whatsapp.messageTemplate.params.flowNotSynced")}
        </p>
      )
    }

    if (screenError) {
      return (
        <p className="text-destructive text-xs">
          {t("messages.errorLoadingData")}
        </p>
      )
    }

    if (mappings.length === 0) {
      return null
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            {t("flows.whatsappFlow.fieldMappings")}
          </Label>
          <CreateCustomFieldDialog
            folderId={null}
            modal={false}
            onSuccess={handleCustomFieldCreated}
            triggerButton={
              <Button
                className="h-auto cursor-pointer p-0 text-[12px] text-primary"
                type="button"
                variant="link"
              >
                {t("flows.whatsappFlow.addCustomField")}
              </Button>
            }
            workspaceId={workspaceId}
          />
        </div>
        <div className="space-y-2">
          {mappings.map((mapping, index) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)] items-end gap-2"
              key={mapping.paramKey}
            >
              <Input disabled value={mapping.paramLabel ?? mapping.paramKey} />
              <div className="flex h-9 items-center justify-center text-muted-foreground">
                →
              </div>
              <CustomFieldSelect
                allowCreate={false}
                label=""
                name={`${fieldName}.fieldMappings.${index}.customFieldId`}
                placeholder={t(
                  "flows.whatsappFlow.selectCustomFieldPlaceholder",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Button
        className="w-full items-center justify-between"
        onClick={() => setOpen(true)}
        type="button"
        variant="secondary"
      >
        <span className="flex-1 truncate text-center">{flowName}</span>
        <Pencil className="size-4" />
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("flows.whatsappFlow.editDialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">
                {t("flows.whatsappFlow.selectFlow")}
              </Label>
              <Input disabled value={flowName} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                {t("flows.whatsappFlow.startScreen")}
              </Label>
              <Input disabled value={startScreenLabel} />
            </div>

            {renderMappingSection()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CarouselParamField({
  param,
  fieldName,
  enableMediaUpload,
}: {
  param: ParameterInfo
  fieldName: string
  enableMediaUpload?: boolean
}) {
  const t = useTranslations()

  if (param.format === "image" || param.format === "video") {
    if (enableMediaUpload) {
      return (
        <div className="space-y-1">
          <Label className="text-xs">
            {t("whatsapp.messageTemplate.params.carouselCard", {
              index: (param.cardIndex ?? 0) + 1,
            })}{" "}
            -{" "}
            {param.format === "image"
              ? t("whatsapp.messageTemplate.image.label")
              : t("whatsapp.messageTemplate.video.label")}
          </Label>
          <MediaHeaderField
            fieldName={`${fieldName}.header[0]`}
            format={param.format}
          />
        </div>
      )
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs">
          {t("whatsapp.messageTemplate.params.carouselCard", {
            index: (param.cardIndex ?? 0) + 1,
          })}{" "}
          -{" "}
          {param.format === "image"
            ? t("whatsapp.messageTemplate.image.label")
            : t("whatsapp.messageTemplate.video.label")}{" "}
          {t("fields.url.label")}
        </Label>
        <TiptapEditorField
          channels={["whatsapp"]}
          name={`${fieldName}.header[0].${param.format}.link`}
          placeholder={t("whatsapp.messageTemplate.params.enterFormatUrl", {
            format:
              param.format === "image"
                ? t("whatsapp.messageTemplate.image.label")
                : t("whatsapp.messageTemplate.video.label"),
          })}
          showEmojiPicker={false}
        />
      </div>
    )
  }

  if (param.format === "text") {
    return (
      <div className="grid grid-cols-[90px_18px_1fr] items-start gap-2">
        <div className="flex h-7 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xs">
          {t("whatsapp.messageTemplate.params.carouselCard", {
            index: (param.cardIndex ?? 0) + 1,
          })}{" "}
          {`{{${param.paramName}}}`}
        </div>
        <div className="flex h-7 items-center justify-center text-muted-foreground">
          →
        </div>
        <TiptapEditorField
          channels={["whatsapp"]}
          name={`${fieldName}.body[${param.index}].text`}
          placeholder=""
          showEmojiPicker={false}
        />
      </div>
    )
  }

  return null
}

function LimitedTimeOfferField({ fieldName }: { fieldName: string }) {
  const t = useTranslations()
  const { register } = useFormContext()

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {t("whatsapp.messageTemplate.params.limitedTimeOffer")}
      </Label>
      <Input
        {...register(`${fieldName}.expiration_time_ms`, {
          valueAsNumber: true,
        })}
        placeholder={t(
          "whatsapp.messageTemplate.params.limitedTimeOfferPlaceholder",
        )}
        type="number"
      />
      <p className="text-muted-foreground text-xs">
        {t("whatsapp.messageTemplate.params.limitedTimeOfferHelp")}
      </p>
    </div>
  )
}

function LocationParamField({ fieldName }: { fieldName: string }) {
  const t = useTranslations()
  const { register } = useFormContext()

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {t("whatsapp.messageTemplate.params.location")}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          {...register(`${fieldName}.location.latitude`)}
          placeholder={t("whatsapp.messageTemplate.params.latitude")}
        />
        <Input
          {...register(`${fieldName}.location.longitude`)}
          placeholder={t("whatsapp.messageTemplate.params.longitude")}
        />
      </div>
      <Input
        {...register(`${fieldName}.location.name`)}
        placeholder={t("whatsapp.messageTemplate.params.locationName")}
      />
      <Input
        {...register(`${fieldName}.location.address`)}
        placeholder={t("whatsapp.messageTemplate.params.locationAddress")}
      />
    </div>
  )
}

const MEDIA_ACCEPT_TYPES: Record<string, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/3gpp",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain",
}

const MEDIA_MAX_SIZE: Record<string, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
}

const FORMAT_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: VideoIcon,
  document: FileIcon,
}

function MediaHeaderField({
  fieldName,
  format,
}: {
  fieldName: string
  format: string
}) {
  const t = useTranslations()
  const workspaceId = useWorkspaceId()
  const { setValue, control } = useFormContext()
  const currentUrl = useWatch({
    control,
    name: `${fieldName}.${format}.link`,
  }) as string | undefined
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleClear = useCallback(() => {
    setValue(`${fieldName}.${format}.link`, "", {
      shouldValidate: true,
      shouldDirty: true,
    })
  }, [fieldName, format, setValue])

  const FormatIcon = FORMAT_ICONS[format] ?? FileIcon

  if (currentUrl) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">
          {t(`whatsapp.messageTemplate.${format}.label`)}
        </Label>
        <div className="flex items-center gap-2 rounded-md border p-2">
          {format === "image" ? (
            <Image
              alt=""
              className="size-12 rounded object-cover"
              height={48}
              src={currentUrl}
              width={48}
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded bg-muted">
              <FormatIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-muted-foreground text-sm">
            {currentUrl.split("/").pop()}
          </span>
          <Button
            className="size-7"
            onClick={handleClear}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {t(`whatsapp.messageTemplate.${format}.label`)}
      </Label>
      <DirectUploadButton
        accept={MEDIA_ACCEPT_TYPES[format] ?? "*/*"}
        label={t("whatsapp.messageTemplate.params.uploadFormat", {
          format: t(`whatsapp.messageTemplate.${format}.label`),
        })}
        maxFiles={1}
        maxSize={MEDIA_MAX_SIZE[format] ?? 16 * 1024 * 1024}
        onUploadError={(error, file) => {
          toast.error(`${file.name}: ${error.message}`)
        }}
        onUploadSuccess={(_filePath, _file, publicUrl) => {
          setValue(`${fieldName}.${format}.link`, publicUrl, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }}
        triggerRef={triggerRef}
        uploadPath={`public/space/${workspaceId}/broadcast-media`}
        workspaceId={workspaceId}
      />
    </div>
  )
}

export function TemplateParamsForm({
  components,
  parentName,
  enableMediaUpload,
}: TemplateParamsFormProps) {
  const t = useTranslations()
  const { getValues, setValue } = useFormContext()
  const parameters = useMemo(
    () => extractParameterInfos(components),
    [components],
  )

  useEffect(() => {
    for (const param of parameters) {
      const fieldName = getFieldName(param, parentName)

      if (param.type === "button" && param.buttonSubType) {
        setValue(`${fieldName}.sub_type`, param.buttonSubType)
        setValue(`${fieldName}.index`, param.buttonIndex)
        if (param.buttonSubType === "flow") {
          setValue(`${fieldName}.flowSourceId`, param.flowSourceId)
          setValue(`${fieldName}.navigateScreenId`, param.navigateScreenId)
          if (!getValues(`${fieldName}.fieldMappings`)) {
            setValue(`${fieldName}.fieldMappings`, [])
          }
        }
      } else if (param.type === "carousel" && param.cardIndex !== undefined) {
        setValue(`${fieldName}.card_index`, param.cardIndex)
      } else if (
        param.format &&
        ["image", "video", "document"].includes(param.format)
      ) {
        setValue(`${fieldName}.type`, param.format)
      } else if (param.format === "location") {
        setValue(`${fieldName}.type`, "location")
      } else {
        setValue(`${fieldName}.type`, "text")
      }
    }
  }, [getValues, parameters, parentName, setValue])

  if (parameters.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {parameters.map((param: ParameterInfo) => {
        const fieldName = getFieldName(param, parentName)
        const key = `param-${param.type}-${param.format ?? ""}-${param.paramName}-${param.cardIndex ?? ""}-${param.buttonIndex ?? ""}`

        if (param.type === "button") {
          return (
            <ButtonParamField fieldName={fieldName} key={key} param={param} />
          )
        }

        if (param.type === "carousel") {
          return (
            <CarouselParamField
              enableMediaUpload={enableMediaUpload}
              fieldName={fieldName}
              key={key}
              param={param}
            />
          )
        }

        if (param.type === "limited_time_offer") {
          return <LimitedTimeOfferField fieldName={fieldName} key={key} />
        }

        if (param.format === "location") {
          return <LocationParamField fieldName={fieldName} key={key} />
        }

        if (
          param.format &&
          ["image", "video", "document"].includes(param.format)
        ) {
          if (enableMediaUpload) {
            return (
              <MediaHeaderField
                fieldName={fieldName}
                format={param.format}
                key={key}
              />
            )
          }
          return (
            <div className="space-y-1" key={key}>
              <TiptapEditorField
                channels={["whatsapp"]}
                name={`${fieldName}.${param.format}.link`}
                placeholder={t(
                  "whatsapp.messageTemplate.params.enterFormatUrl",
                  {
                    format: t(`whatsapp.messageTemplate.${param.format}.label`),
                  },
                )}
                showEmojiPicker={false}
              />
            </div>
          )
        }

        return (
          <div
            className="grid grid-cols-[90px_18px_1fr] items-start gap-2"
            key={key}
          >
            <div className="flex h-7 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xs">
              {`{{${param.paramName}}}`}
            </div>
            <div className="flex h-7 items-center justify-center text-muted-foreground">
              →
            </div>
            <TiptapEditorField
              channels={["whatsapp"]}
              name={`${fieldName}.text`}
              placeholder=""
              showEmojiPicker={false}
            />
          </div>
        )
      })}
    </div>
  )
}
