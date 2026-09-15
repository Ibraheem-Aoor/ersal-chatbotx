import { z } from "zod"
import {
  buttonStepDefaultFn,
  buttonStepSchema,
  validateButtonLimits,
} from "../button/schema"

export const templateVideoSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) => file && file instanceof File && file.type === "video/mp4",
          {
            message: "يجب أن يكون الملف فيديو بصيغة mp4",
          },
        )
        .refine((file) => file && file.size <= 20 * 1024 * 1024, {
          message: "يجب ألا يتجاوز حجم الملف 20 ميجابايت",
        }),
    }),
    body: z.object({
      text: z.string().trim().min(1).max(1024),
      variables: z.array(z.string().min(1).max(255)),
    }),
    footer: z.string().trim().max(60).nullable(),
    buttons: z.array(buttonStepSchema).max(10),
  })
  .superRefine((data, ctx) => {
    validateButtonLimits(data.buttons, ctx)
  })

export type TemplateVideoSchema = z.infer<typeof templateVideoSchema>

export const templateVideoDefaultValue = (
  countBtn = 0,
): TemplateVideoSchema => ({
  hideHeader: true,
  showFooter: true,
  header: {
    file: null,
  },
  body: {
    text: "",
    variables: [],
  },
  footer: "",
  buttons: Array.from({ length: countBtn }, (_, index) =>
    buttonStepDefaultFn(`Button #${index + 1}`),
  ),
})
