import type { SendAudioStepSchema } from "@chatbotx.io/flow-config"
import type { MessageHandlers } from "@chatbotx.io/sdk"
import { Audio } from "whatsapp-api-js/messages"
import type { WhatsappAuthValue } from "../../../schema"

export function* convertFlowStepAudio(
  props: Parameters<
    MessageHandlers<WhatsappAuthValue, SendAudioStepSchema>["sendFlowStep"]
  >[0],
) {
  const {
    data: { step },
  } = props

  // WhatsApp does not support buttons on audio messages, so we simply
  // yield the audio media. Any buttons defined on the step are ignored
  // (they have no interactive-message representation for audio).
  yield new Audio(step.url)
}
