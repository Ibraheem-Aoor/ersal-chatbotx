import { ChatbotXException } from "@chatbotx.io/business/errors"
import { getTranslations } from "next-intl/server"

const QUOTA_ERROR_MAP: Record<string, string> = {
  "Workspace limit reached for this plan": "workspaceLimitReached",
  "Contact limit reached": "contactLimitReached",
  "This account is already connected to another workspace.":
    "channelDuplicated",
  "Phone number already exists": "phoneNumberExists",
  "Contact inbox not found": "contactInboxNotFound",
}

export async function translateQuotaError(
  error: ChatbotXException,
): Promise<ChatbotXException> {
  const key = QUOTA_ERROR_MAP[error.message]
  if (key) {
    const t = await getTranslations("billing.quotaLimits")
    return new ChatbotXException(t(key), error.code, error.httpStatusCode)
  }
  return error
}
