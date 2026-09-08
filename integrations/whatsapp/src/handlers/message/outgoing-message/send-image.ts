import type { SendImageStepSchema } from "@chatbotx.io/flow-config"
import type { MessageHandlers } from "@chatbotx.io/sdk"
import { Image } from "whatsapp-api-js/messages"
import type { WhatsappAuthValue } from "../../../schema"
import { buildWhatsappButtonMessages } from "./shared"

export function* convertFlowStepImage(
  props: Parameters<
    MessageHandlers<WhatsappAuthValue, SendImageStepSchema>["sendFlowStep"]
  >[0],
) {
  const {
    data: { step },
  } = props
  const quickReplies = props.data.quickReplies ?? []
  if (step.buttons.length + quickReplies.length === 0) {
    yield new Image(step.url)
    return
  }

  // Past three replies the image can no longer be an inline header, so it is
  // sent as its own message — `buildWhatsappButtonMessages` owns that split.
  //
  // FORK PATCH: Meta requires `interactive.body.text` to be non-empty. The
  // image step schema has no text field, so we use a zero-width space as a
  // minimal placeholder that passes validation but is invisible to the user.
  for (const message of buildWhatsappButtonMessages({
    flowId: props.data.flowId,
    flowVersionId: props.data.flowVersionId,
    buttons: step.buttons,
    quickReplies,
    metadata: props.data.metadata,
    bodyText: "​",
    media: new Image(step.url),
  })) {
    yield message
  }
}
