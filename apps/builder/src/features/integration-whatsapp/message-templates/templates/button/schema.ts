import { z } from "zod"

const DYNAMIC_URL_SUFFIX_RE = /\{\{1\}\}$/

export const buttonActionTypes = z.enum([
  "quickReply",
  "url",
  "phoneNumber",
  "flow",
  "copyCode",
])

export const buttonStepSchema = z
  .object({
    text: z.string().min(1).max(25),
  })
  .and(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal(buttonActionTypes.enum.quickReply),
      }),
      z.object({
        type: z.literal(buttonActionTypes.enum.url),
        url: z.string().min(1).max(2000),
        urlDynamic: z.boolean().optional(),
        urlSampleValue: z.string().optional(),
      }),
      z.object({
        type: z.literal(buttonActionTypes.enum.flow),
        flow_id: z.string().min(1),
      }),
      z.object({
        type: z.literal(buttonActionTypes.enum.phoneNumber),
        phone_number: z
          .string()
          .trim()
          .max(20)
          .regex(/^\+?[1-9][0-9]{7,18}$/, {
            message: "validation.template.phoneFormat",
          }),
      }),
      z.object({
        type: z.literal(buttonActionTypes.enum.copyCode),
        example: z.string().min(1).max(15),
      }),
    ]),
  )
  .superRefine((data, ctx) => {
    if (data.type === "url") {
      const urlVal = data.url
      if (data.urlDynamic) {
        if (!urlVal.endsWith("{{1}}")) {
          ctx.addIssue({
            path: ["url"],
            message: "validation.template.dynamicUrlSuffix",
            code: z.ZodIssueCode.custom,
          })
        }
        const base = urlVal.replace(DYNAMIC_URL_SUFFIX_RE, "")
        try {
          new URL(base.endsWith("/") ? base : `${base}/`)
        } catch {
          ctx.addIssue({
            path: ["url"],
            message: "validation.template.invalidUrl",
            code: z.ZodIssueCode.custom,
          })
        }
        if (!data.urlSampleValue?.trim()) {
          ctx.addIssue({
            path: ["urlSampleValue"],
            message: "validation.template.dynamicUrlSampleRequired",
            code: z.ZodIssueCode.custom,
          })
        }
      } else {
        try {
          new URL(urlVal)
        } catch {
          ctx.addIssue({
            path: ["url"],
            message: "validation.template.invalidUrl",
            code: z.ZodIssueCode.custom,
          })
        }
      }
    }
  })

export type ButtonStepProps = z.infer<typeof buttonStepSchema>

export type ButtonActionType = z.infer<typeof buttonActionTypes>

/**
 * Meta WhatsApp Template Button Limits
 * @see https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#buttons
 */
export const BUTTON_LIMITS = {
  /** Maximum total buttons across all types */
  total: 10,
  /** Per-type maximums */
  perType: {
    quickReply: 10,
    url: 2,
    phoneNumber: 1,
    copyCode: 1,
    /** Meta docs: 1 flow button per template */
    flow: 1,
  },
  /** AUTHENTICATION category: exactly 1 OTP (copyCode) button, nothing else */
  authMaxButtons: 1,
} as const

/**
 * Button type groups for auto-sorting.
 * Quick replies first, then CTAs.
 */
export const BUTTON_GROUPS = {
  quickReply: ["quickReply"] as const,
  cta: ["url", "phoneNumber", "copyCode", "flow"] as const,
} as const

/**
 * Validate per-type button limits. Use as `.superRefine()` on the buttons array.
 */
export function validateButtonLimits(
  buttons: ButtonStepProps[],
  ctx: z.RefinementCtx,
  category?: string,
) {
  // AUTH category: exactly 1 copyCode button
  if (category === "AUTHENTICATION") {
    if (buttons.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "validation.template.authOneButton",
      })
    }
    if (buttons.length > 0 && buttons[0]?.type !== "copyCode") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "validation.template.authMustBeCopyCode",
        path: [0, "type"],
      })
    }
    return
  }

  const buttonLimitKeys: Record<string, string> = {
    quickReply: "validation.template.buttonLimitQuickReply",
    url: "validation.template.buttonLimitUrl",
    phoneNumber: "validation.template.buttonLimitPhoneNumber",
    copyCode: "validation.template.buttonLimitCopyCode",
    flow: "validation.template.buttonLimitFlow",
  }

  // Count by type
  const counts: Record<string, number> = {}
  for (const btn of buttons) {
    counts[btn.type] = (counts[btn.type] || 0) + 1
  }

  // Per-type validation
  for (const [type, max] of Object.entries(BUTTON_LIMITS.perType)) {
    if ((counts[type] || 0) > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: buttonLimitKeys[type] || type,
      })
    }
  }

  // Grouping: quick replies must be contiguous, CTAs must be contiguous
  let lastGroup: "quickReply" | "cta" | null = null
  let sawQrAfterCta = false
  let sawCtaAfterQr = false
  for (const btn of buttons) {
    const group = btn.type === "quickReply" ? "quickReply" : "cta"
    if (lastGroup === "cta" && group === "quickReply") {
      sawQrAfterCta = true
    }
    if (lastGroup === "quickReply" && group === "cta") {
      if (sawCtaAfterQr) {
        // Already went CTA → QR → CTA — not allowed
      }
      sawCtaAfterQr = true
    }
    lastGroup = group
  }
  if (sawQrAfterCta && sawCtaAfterQr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validation.template.buttonGrouping",
    })
  }
}

export const buttonStepDefaultFn = (text = ""): ButtonStepProps => ({
  text,
  type: buttonActionTypes.enum.quickReply,
})

/** Create a default button for a specific type */
export const buttonStepDefaultForType = (
  type: ButtonActionType,
  _index: number,
): ButtonStepProps => {
  const base = { text: "", type }
  switch (type) {
    case "url":
      return { ...base, type: "url", url: "", urlDynamic: false }
    case "phoneNumber":
      return { ...base, type: "phoneNumber", phone_number: "" }
    case "copyCode":
      return { ...base, type: "copyCode", example: "" }
    case "flow":
      return { ...base, type: "flow", flow_id: "" }
    default:
      return { ...base, type: "quickReply" }
  }
}
