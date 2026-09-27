import { z } from "zod"
import {
  buttonStepDefaultFn,
  buttonStepSchema,
  validateButtonLimits,
} from "../button/schema"
import {
  refineBodyText,
  refineFooterText,
  refineSampleValues,
} from "../validation"

export const templateImageSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) =>
            file &&
            file instanceof File &&
            ["image/png", "image/jpg", "image/jpeg"].includes(file.type),
          {
            message: "validation.template.fileImageType",
          },
        )
        .refine((file) => file && file.size <= 5 * 1024 * 1024, {
          message: "validation.template.fileSizeImage",
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
    refineBodyText(data.body.text, ctx)
    refineSampleValues(data.body.variables, data.body.text, ctx, [
      "body",
      "variables",
    ])
    refineFooterText(data.footer, ctx)
    validateButtonLimits(data.buttons, ctx)
  })

export type TemplateImageSchema = z.infer<typeof templateImageSchema>

export const templateImageEditSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) =>
            file === null ||
            (file instanceof File &&
              ["image/png", "image/jpg", "image/jpeg"].includes(file.type)),
          {
            message: "validation.template.fileImageType",
          },
        )
        .refine(
          (file) => file === null || (file && file.size <= 5 * 1024 * 1024),
          {
            message: "validation.template.fileSizeImage",
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
    refineBodyText(data.body.text, ctx)
    refineSampleValues(data.body.variables, data.body.text, ctx, [
      "body",
      "variables",
    ])
    refineFooterText(data.footer, ctx)
    validateButtonLimits(data.buttons, ctx)
  })

export const templateImageDefaultValue = (
  countBtn = 0,
): TemplateImageSchema => ({
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
  buttons: Array.from({ length: countBtn }, (_, _index) =>
    buttonStepDefaultFn(""),
  ),
})
