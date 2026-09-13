import type { SendVideoStepSchema } from "@chatbotx.io/flow-config"
import type { MessageHandlers } from "@chatbotx.io/sdk"
import { Video } from "whatsapp-api-js/messages"
import type { WhatsappAuthValue } from "../../../schema"
import { buildWhatsappButtonMessages } from "./shared"

export function* convertFlowStepVideo(
  props: Parameters<
    MessageHandlers<WhatsappAuthValue, SendVideoStepSchema>["sendFlowStep"]
  >[0],
) {
  const {
    data: { step },
  } = props
  const quickReplies = props.data.quickReplies ?? []
  if (step.buttons.length + quickReplies.length === 0) {
    yield new Video(step.url)
    return
  }

  // WhatsApp interactive messages support video headers, so we reuse
  // `buildWhatsappButtonMessages`. The `media` parameter accepts any
  // media object that whatsapp-api-js serialises with a header type.
  for (const message of buildWhatsappButtonMessages({
    flowId: props.data.flowId,
    flowVersionId: props.data.flowVersionId,
    buttons: step.buttons,
    quickReplies,
    metadata: props.data.metadata,
    bodyText: "​",
    // biome-ignore lint/suspicious/noExplicitAny: Video is a valid interactive header per the WhatsApp API, but the shared helper types media as Image — a safe widening here.
    media: new Video(step.url) as any,
  })) {
    yield message
  }
}
