import type { ButtonStepProps } from "../templates/button/schema"
import type { TemplateType } from "../type"
import { templateTypes } from "../type"

/**
 * Meta API component shape (as stored in DB after sync)
 */
// biome-ignore lint/suspicious/noExplicitAny: Meta API response shape varies
type MetaComponent = Record<string, any>

/**
 * Converts Meta API component array back to the form's `content` default values.
 *
 * Media headers (IMAGE/VIDEO/DOCUMENT) cannot restore the original File object,
 * so `header.file` will be `null` — the user will need to re-upload when editing.
 */
export function metaComponentsToFormValues(
  components: MetaComponent[],
  templateType: TemplateType,
) {
  if (!Array.isArray(components)) {
    return undefined
  }

  const header = components.find((c) => c.type === "HEADER")
  const body = components.find((c) => c.type === "BODY")
  const footer = components.find((c) => c.type === "FOOTER")
  const buttonsComponent = components.find((c) => c.type === "BUTTONS")

  // Parse buttons from Meta format → form format
  const buttons: ButtonStepProps[] = Array.isArray(buttonsComponent?.buttons)
    ? buttonsComponent.buttons.map(mapMetaButtonToForm)
    : []

  // Parse body
  const bodyValues = {
    text: (body?.text as string) || "",
    variables: Array.isArray(body?.example?.body_text?.[0])
      ? (body.example.body_text[0] as string[])
      : [],
  }

  // Parse footer
  const footerValue = (footer?.text as string) || ""

  switch (templateType) {
    case templateTypes.enum.Image:
    case templateTypes.enum.Video:
    case templateTypes.enum.Document:
      return {
        hideHeader: true,
        showFooter: true,
        header: {
          // Can't restore File from Meta — user must re-upload
          file: null,
        },
        body: bodyValues,
        footer: footerValue,
        buttons,
      }

    case templateTypes.enum.Text:
    default:
      return {
        hideHeader: !!header,
        showFooter: true,
        header: {
          text: header?.format === "TEXT" ? ((header.text as string) || "") : "",
          variables: Array.isArray(header?.example?.header_text)
            ? (header.example.header_text as string[])
            : [],
        },
        body: bodyValues,
        footer: footerValue,
        buttons,
      }
  }
}

/**
 * Maps a single Meta API button object to the form's ButtonStepProps
 */
function mapMetaButtonToForm(
  // biome-ignore lint/suspicious/noExplicitAny: Meta API button shape
  btn: Record<string, any>,
): ButtonStepProps {
  const text = (btn.text as string) || ""

  switch (btn.type) {
    case "URL": {
      const url = (btn.url as string) || ""
      const isDynamic = url.includes("{{1}}")
      return {
        type: "url",
        text,
        url,
        urlDynamic: isDynamic,
        urlSampleValue: isDynamic
          ? ((btn.example?.[0] as string) || "")
          : undefined,
      }
    }

    case "PHONE_NUMBER":
      return {
        type: "phoneNumber",
        text,
        phone_number: (btn.phone_number as string) || "",
      }

    case "COPY_CODE":
      return {
        type: "copyCode",
        text,
        example: (btn.example as string) || "",
      }

    case "FLOW":
      return {
        type: "flow",
        text,
        flow_id: (btn.flow_id as string) || "",
      }

    case "QUICK_REPLY":
    default:
      return {
        type: "quickReply",
        text,
      }
  }
}
