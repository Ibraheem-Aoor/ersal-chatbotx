"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SwitchField } from "@chatbotx.io/ui/components/form/switch-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  CopyIcon,
  GlobeIcon,
  MessageSquareReplyIcon,
  PhoneIcon,
  TrashIcon,
  WorkflowIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { memo, useCallback, useMemo } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { FlowSelectField } from "../../components/flow-select-field"
import {
  BUTTON_LIMITS,
  type ButtonActionType,
  type ButtonStepProps,
  buttonStepDefaultForType,
} from "./schema"

// ---------------------------------------------------------------------------
// Per-type field configuration
// ---------------------------------------------------------------------------

const CHIP_CONFIG: Array<{
  type: ButtonActionType
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  group: "quickReply" | "cta"
}> = [
  {
    type: "quickReply",
    labelKey: "fields.quickReply.label",
    icon: MessageSquareReplyIcon,
    group: "quickReply",
  },
  {
    type: "url",
    labelKey: "fields.url.label",
    icon: GlobeIcon,
    group: "cta",
  },
  {
    type: "phoneNumber",
    labelKey: "fields.phoneNumber.label",
    icon: PhoneIcon,
    group: "cta",
  },
  {
    type: "copyCode",
    labelKey: "whatsapp.messageTemplate.buttonType.copyCode",
    icon: CopyIcon,
    group: "cta",
  },
  {
    type: "flow",
    labelKey: "fields.whatsappFlow.label",
    icon: WorkflowIcon,
    group: "cta",
  },
]

// ---------------------------------------------------------------------------
// Single inline button row — renders different fields per type
// ---------------------------------------------------------------------------

function InlineButtonRow({
  index,
  parentName,
  onRemove,
  min,
}: {
  index: number
  parentName: string
  onRemove: (index: number) => void
  min: number
}) {
  const t = useTranslations()
  const { control } = useFormContext()
  const type = useWatch({ control, name: `${parentName}.${index}.type` })
  const urlDynamic = useWatch({
    control,
    name: `${parentName}.${index}.urlDynamic`,
  })
  const chipConfig = CHIP_CONFIG.find((c) => c.type === type)
  const Icon = chipConfig?.icon

  // Prevent Enter key in inputs from submitting the outer form
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
        e.preventDefault()
      }
    },
    [],
  )

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: prevents Enter from submitting outer form
    // biome-ignore lint/a11y/noStaticElementInteractions: prevents Enter from submitting outer form
    <div
      className="group relative rounded-md border bg-background p-3"
      onKeyDown={handleKeyDown}
    >
      {/* Row header: type badge + delete */}
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
          {Icon && <Icon className="size-3.5" />}
          {chipConfig ? t(chipConfig.labelKey) : type}
        </span>
        {index >= min && (
          <button
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={() => onRemove(index)}
            type="button"
          >
            <TrashIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Button text — all types */}
      <div className="flex flex-col gap-2">
        <InputField
          label={t("whatsapp.messageTemplate.buttonText")}
          name={`${parentName}.${index}.text`}
          placeholder={t("whatsapp.messageTemplate.buttonTextPlaceholder")}
        />

        {/* URL-specific fields */}
        {type === "url" && (
          <>
            <InputField
              label={t("fields.url.label")}
              name={`${parentName}.${index}.url`}
              placeholder={
                urlDynamic
                  ? "https://example.com/order/{{1}}"
                  : "https://example.com"
              }
            />
            <SwitchField
              description={t("whatsapp.messageTemplate.dynamicUrl.description")}
              label={t("whatsapp.messageTemplate.dynamicUrl.label")}
              name={`${parentName}.${index}.urlDynamic`}
            />
            {urlDynamic && (
              <InputField
                description={t(
                  "whatsapp.messageTemplate.dynamicUrl.sampleHint",
                )}
                label={t("whatsapp.messageTemplate.dynamicUrl.sampleLabel")}
                name={`${parentName}.${index}.urlSampleValue`}
                placeholder="abc123"
              />
            )}
          </>
        )}

        {/* Phone-specific field */}
        {type === "phoneNumber" && (
          <InputField
            label={t("fields.phoneNumber.label")}
            name={`${parentName}.${index}.phone_number`}
            placeholder="+1234567890"
          />
        )}

        {/* Copy Code-specific field */}
        {type === "copyCode" && (
          <InputField
            description={t("whatsapp.messageTemplate.copyCode.description")}
            label={t("whatsapp.messageTemplate.copyCode.label")}
            name={`${parentName}.${index}.example`}
            placeholder="123456"
          />
        )}

        {/* Flow-specific field */}
        {type === "flow" && (
          <FlowSelectField name={`${parentName}.${index}.flow_id`} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component: inline chip-based button editor
// ---------------------------------------------------------------------------

type ButtonGroupPreviewComponentProps = {
  parentName: string
  changeType?: boolean
  min?: number
  max?: number
}

const ButtonGroupPreviewComponent = (
  props: ButtonGroupPreviewComponentProps,
) => {
  const { parentName, min = 0, max = 10 } = props
  const t = useTranslations()
  const { control } = useFormContext()

  // Watch category from the parent form to enforce AUTH rules
  const category = useWatch({ control, name: "category" }) as string | undefined
  const { fields, append, remove } = useFieldArray({
    control,
    name: parentName,
  })

  // Watch all buttons to compute per-type counts
  const buttons = useWatch({ control, name: parentName }) as
    | ButtonStepProps[]
    | undefined
  const buttonList = buttons ?? []

  const isAuth = category === "AUTHENTICATION"
  // Use fields.length (from useFieldArray) as the authoritative count.
  // useWatch can return stale/phantom entries after remove(), causing ghost buttons.
  const totalCount = fields.length
  const effectiveMax = isAuth ? BUTTON_LIMITS.authMaxButtons : max

  // Per-type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const btn of buttonList) {
      if (btn?.type) {
        counts[btn.type] = (counts[btn.type] || 0) + 1
      }
    }
    return counts
  }, [buttonList])

  // Determine which chips are disabled
  const isChipDisabled = useCallback(
    (type: ButtonActionType) => {
      if (totalCount >= effectiveMax) {
        return true
      }

      if (isAuth) {
        // AUTH: only copyCode allowed
        return type !== "copyCode"
      }

      const perTypeMax =
        BUTTON_LIMITS.perType[type as keyof typeof BUTTON_LIMITS.perType]
      if (perTypeMax !== undefined && (typeCounts[type] || 0) >= perTypeMax) {
        return true
      }

      return false
    },
    [totalCount, effectiveMax, typeCounts, isAuth],
  )

  // Has at least one button of this type
  const hasType = useCallback(
    (type: ButtonActionType) => (typeCounts[type] || 0) > 0,
    [typeCounts],
  )

  const addButton = useCallback(
    (type: ButtonActionType) => {
      if (isChipDisabled(type)) {
        return
      }
      append(buttonStepDefaultForType(type, fields.length))
    },
    [append, fields.length, isChipDisabled],
  )

  const handleRemove = useCallback(
    (index: number) => {
      remove(index)
    },
    [remove],
  )

  // Group buttons: quick replies first, then CTAs.
  // Bound by fields.length to avoid phantom entries from stale useWatch data.
  const groupedIndices = useMemo(() => {
    const qrIndices: number[] = []
    const ctaIndices: number[] = []
    const len = Math.min(fields.length, buttonList.length)
    for (let i = 0; i < len; i++) {
      const type = buttonList[i]?.type
      if (!type) {
        continue // skip phantom entries with no valid type
      }
      if (type === "quickReply") {
        qrIndices.push(i)
      } else {
        ctaIndices.push(i)
      }
    }
    return { qrIndices, ctaIndices }
  }, [buttonList, fields.length])

  const hasQrButtons = groupedIndices.qrIndices.length > 0
  const hasCtaButtons = groupedIndices.ctaIndices.length > 0

  // Chips to show — for AUTH, only copyCode
  const visibleChips = isAuth
    ? CHIP_CONFIG.filter((c) => c.type === "copyCode")
    : CHIP_CONFIG

  return (
    <div className="flex flex-col gap-3">
      {/* Section header with counter */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-xs text-zinc-500 dark:text-zinc-400">
          {t("whatsapp.messageTemplate.sectionButtons")}
        </span>
        <span className="font-medium text-xs text-zinc-400 dark:text-zinc-500">
          {totalCount}/{effectiveMax}
        </span>
      </div>

      {/* Grouped button rows: Quick Replies */}
      {hasQrButtons && (
        <div className="flex flex-col gap-2">
          {buttonList.length > 1 && hasCtaButtons && (
            <span className="text-[11px] text-muted-foreground">
              {t("whatsapp.messageTemplate.quickRepliesGroup")}
            </span>
          )}
          {groupedIndices.qrIndices.map((originalIndex) => (
            <InlineButtonRow
              index={originalIndex}
              key={fields[originalIndex]?.id ?? originalIndex}
              min={min}
              onRemove={handleRemove}
              parentName={parentName}
            />
          ))}
        </div>
      )}

      {/* Grouped button rows: CTAs */}
      {hasCtaButtons && (
        <div className="flex flex-col gap-2">
          {buttonList.length > 1 && hasQrButtons && (
            <span className="text-[11px] text-muted-foreground">
              {t("whatsapp.messageTemplate.ctaGroup")}
            </span>
          )}
          {groupedIndices.ctaIndices.map((originalIndex) => (
            <InlineButtonRow
              index={originalIndex}
              key={fields[originalIndex]?.id ?? originalIndex}
              min={min}
              onRemove={handleRemove}
              parentName={parentName}
            />
          ))}
        </div>
      )}

      {/* Inline chips — add button by type */}
      <div className="flex flex-wrap gap-2">
        {visibleChips.map((chip) => {
          const disabled = isChipDisabled(chip.type)
          const active = hasType(chip.type)
          const Icon = chip.icon

          return (
            <Button
              className={
                active && !disabled
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : ""
              }
              disabled={disabled}
              key={chip.type}
              onClick={() => addButton(chip.type)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Icon className="size-3.5" />
              <span className="text-xs">+ {t(chip.labelKey)}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export const ButtonGroupPreview = memo(ButtonGroupPreviewComponent)
