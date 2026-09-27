import { z } from "zod"
import { buttonActionTypes, buttonStepSchema } from "../button/schema"

export const templateCatalogSchema = z.object({
  hideHeader: z.boolean(),
  showFooter: z.boolean(),
  body: z.object({
    text: z.string().trim().min(1).max(1024),
    variables: z.array(z.string().min(1).max(255)),
  }),
  footer: z.string().trim().max(60).nullable(),
  buttons: z.array(buttonStepSchema).length(1),
})

export type TemplateCatalogSchema = z.infer<typeof templateCatalogSchema>

export const templateCatalogDefaultValue = (): TemplateCatalogSchema => ({
  hideHeader: false,
  showFooter: true,
  body: {
    text: "",
    variables: [],
  },
  footer: "",
  buttons: [{ text: "", type: buttonActionTypes.enum.quickReply }],
})
