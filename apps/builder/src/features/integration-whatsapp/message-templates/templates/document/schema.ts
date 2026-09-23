import { z } from "zod"
import { buttonStepSchema, validateButtonLimits } from "../button/schema"

export const templateDocumentSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) =>
            file && file instanceof File && file.type === "application/pdf",
          {
            message: "يجب أن يكون الملف مستند PDF",
          },
        )
        .refine((file) => file && file.size <= 100 * 1024 * 1024, {
          message: "يجب ألا يتجاوز حجم الملف 100 ميجابايت",
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

export type TemplateDocumentSchema = z.infer<typeof templateDocumentSchema>

export const templateDocumentEditSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) =>
            file === null ||
            (file instanceof File && file.type === "application/pdf"),
          {
            message: "يجب أن يكون الملف مستند PDF",
          },
        )
        .refine(
          (file) => file === null || (file && file.size <= 100 * 1024 * 1024),
          {
            message: "يجب ألا يتجاوز حجم الملف 100 ميجابايت",
          },
        ),
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

export const templateDocumentDefaultValue = (): TemplateDocumentSchema => ({
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
  buttons: [],
})
