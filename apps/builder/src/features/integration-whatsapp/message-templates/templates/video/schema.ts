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
            message: "validation.template.fileVideoType",
          },
        )
        .refine((file) => file && file.size <= 16 * 1024 * 1024, {
          message: "validation.template.fileSizeVideo",
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

export type TemplateVideoSchema = z.infer<typeof templateVideoSchema>

export const templateVideoEditSchema = z
  .object({
    hideHeader: z.boolean(),
    showFooter: z.boolean(),
    header: z.object({
      file: z
        .any()
        .refine(
          (file) =>
            file === null ||
            (file instanceof File && file.type === "video/mp4"),
          {
            message: "validation.template.fileVideoType",
          },
        )
        .refine(
          (file) => file === null || (file && file.size <= 16 * 1024 * 1024),
          {
            message: "validation.template.fileSizeVideo",
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
  buttons: Array.from({ length: countBtn }, (_, _index) =>
    buttonStepDefaultFn(""),
  ),
})
