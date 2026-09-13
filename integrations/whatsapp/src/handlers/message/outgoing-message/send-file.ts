import type { SendFileStepSchema } from "@chatbotx.io/flow-config"
import type { MessageHandlers } from "@chatbotx.io/sdk"
import { Document } from "whatsapp-api-js/messages"
import type { WhatsappAuthValue } from "../../../schema"

export function* convertFlowStepFile(
  props: Parameters<
    MessageHandlers<WhatsappAuthValue, SendFileStepSchema>["sendFlowStep"]
  >[0],
) {
  const {
    data: { step },
  } = props

  // WhatsApp does not support buttons on document messages, so we simply
  // yield the document media. Any buttons defined on the step are ignored.
  yield new Document(step.url)
}
