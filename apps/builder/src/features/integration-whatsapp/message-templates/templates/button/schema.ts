import { z } from "zod"

export const buttonActionTypes = z.enum([
  "quickReply",
  "url",
  "phoneNumber",
  "flow",
  "copyCode",
])

export const buttonStepSchema = z
  .object({
    text: z.string().min(1).max(100),
  })
  .and(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal(buttonActionTypes.enum.quickReply),
      }),
      z.object({
        type: z.literal(buttonActionTypes.enum.url),
        url: z.string().min(1),
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
            message: "Invalid phone number format",
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
            message: "Dynamic URL must end with {{1}}",
            code: z.ZodIssueCode.custom,
          })
        }
        const base = urlVal.replace(/\{\{1\}\}$/, "")
        try {
          new URL(base.endsWith("/") ? base : `${base}/`)
        } catch {
          ctx.addIssue({
            path: ["url"],
            message: "Invalid URL format",
            code: z.ZodIssueCode.custom,
          })
        }
        if (!data.urlSampleValue?.trim()) {
          ctx.addIssue({
            path: ["urlSampleValue"],
            message: "Sample value is required for dynamic URLs",
            code: z.ZodIssueCode.custom,
          })
        }
      } else {
        try {
          new URL(urlVal)
        } catch {
          ctx.addIssue({
            path: ["url"],
            message: "Invalid URL format",
            code: z.ZodIssueCode.custom,
          })
        }
      }
    }
  })

export type ButtonStepProps = z.infer<typeof buttonStepSchema>

export const buttonStepDefaultFn = (text = ""): ButtonStepProps => ({
  text,
  type: buttonActionTypes.enum.quickReply,
})
