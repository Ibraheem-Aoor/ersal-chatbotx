import { whatsappTemplateCategories } from "@chatbotx.io/database/partials"
import { z } from "zod"
import {
  languageOptions,
  templateTypes,
} from "@/features/integration-whatsapp/message-templates/type"
import { templateCarouselImageSchema } from "../templates/carousel-image/schema"
import { templateCarouselVideoSchema } from "../templates/carousel-video/schema"
import { templateCatalogSchema } from "../templates/catalog/schema"
import {
  templateDocumentEditSchema,
  templateDocumentSchema,
} from "../templates/document/schema"
import {
  templateImageEditSchema,
  templateImageSchema,
} from "../templates/image/schema"
import { templateProductSchema } from "../templates/product/schema"
import { templateTextSchema } from "../templates/text/schema"
import {
  templateVideoEditSchema,
  templateVideoSchema,
} from "../templates/video/schema"

export const createMessageTemplateRequest = z
  .object({
    name: z
      .string()
      .min(1)
      .max(512)
      .regex(
        /^[a-z0-9_]+$/,
        "Only lowercase letters, numbers and underscores allowed",
      ),
    language: z.enum(
      languageOptions.map((option) => option.value) as [string, ...string[]],
    ),
    category: whatsappTemplateCategories,
    templateType: templateTypes,
  })
  .and(
    z.discriminatedUnion("templateType", [
      z.object({
        templateType: z.literal(templateTypes.enum.Text),
        content: templateTextSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Image),
        content: templateImageSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Video),
        content: templateVideoSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Document),
        content: templateDocumentSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.CarouselImage),
        content: templateCarouselImageSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.CarouselVideo),
        content: templateCarouselVideoSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.ViewCatalog),
        content: templateCatalogSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.ViewProduct),
        content: templateProductSchema,
      }),
    ]),
  )

export type CreateMessageTemplateRequest = z.infer<
  typeof createMessageTemplateRequest
>

/**
 * Edit request — same content shape as create but includes the template ID.
 * Name, language, and category are locked (Meta does not allow changes post-creation).
 */
export const editMessageTemplateRequest = z
  .object({
    templateId: z.string().min(1),
    // Locked fields sent for display but not editable
    name: z.string(),
    language: z.string(),
    category: z.string(),
    templateType: templateTypes,
  })
  .and(
    z.discriminatedUnion("templateType", [
      z.object({
        templateType: z.literal(templateTypes.enum.Text),
        content: templateTextSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Image),
        content: templateImageEditSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Video),
        content: templateVideoEditSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.Document),
        content: templateDocumentEditSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.CarouselImage),
        content: templateCarouselImageSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.CarouselVideo),
        content: templateCarouselVideoSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.ViewCatalog),
        content: templateCatalogSchema,
      }),
      z.object({
        templateType: z.literal(templateTypes.enum.ViewProduct),
        content: templateProductSchema,
      }),
    ]),
  )

export type EditMessageTemplateRequest = z.infer<
  typeof editMessageTemplateRequest
>
