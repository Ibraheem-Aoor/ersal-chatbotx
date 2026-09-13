import type { SendGifStepSchema } from "@chatbotx.io/flow-config"
import type { MessageHandlers } from "@chatbotx.io/sdk"
import { Video } from "whatsapp-api-js/messages"
import type { WhatsappAuthValue } from "../../../schema"

export function* convertFlowStepGif(
  props: Parameters<
    MessageHandlers<WhatsappAuthValue, SendGifStepSchema>["sendFlowStep"]
  >[0],
) {
  const {
    data: { step },
  } = props

  // WhatsApp does not have a native GIF type. Animated GIFs are best sent
  // as Video (MP4) — the WhatsApp client auto-loops short videos. If the
  // URL happens to be a .gif, WhatsApp will still accept it as a video.
  yield new Video(step.url)
}
