/**
 * Maps Meta WhatsApp template API error subcodes to user-friendly Arabic messages.
 * Falls back to Meta's own error_user_msg when no mapping exists.
 */

import type { SdkException } from "@chatbotx.io/sdk"

type TemplateErrorMapping = {
  ar: string
  en: string
}

const SUBCODE_MAP: Record<number, TemplateErrorMapping> = {
  2388072: {
    ar: "العنوان يحتوي على تنسيق أو رموز غير مسموحة — استخدم سطراً واحداً بنص عادي.",
    en: "Header contains invalid formatting — use plain text on a single line.",
  },
  2388299: {
    ar: "لا يمكن أن يبدأ النص أو ينتهي بمتغير — أضف كلمة قبله أو بعده.",
    en: "Variables cannot be at the start or end of text — add a word before or after.",
  },
  2388042: {
    ar: "ترقيم المتغيرات غير متسلسل — استخدم {{1}} ثم {{2}} بالترتيب.",
    en: "Variables are not sequential — use {{1}} then {{2}} in order.",
  },
  2388043: {
    ar: "بعض المتغيرات بدون قيمة مثال — أضفها لجميع المتغيرات.",
    en: "Some variables are missing sample values — add them for all variables.",
  },
  2388023: {
    ar: "اسم القالب مستخدم مسبقاً — اختر اسماً آخر.",
    en: "Template name already exists — choose a different name.",
  },
  2388052: {
    ar: "هيكل القالب غير صالح — راجع الرأس والمحتوى والأزرار.",
    en: "Template structure is invalid — check header, body, and buttons.",
  },
  2388058: {
    ar: "إعدادات الأزرار غير صالحة — راجع عدد الأزرار ونوعها.",
    en: "Button configuration is invalid — check button count and types.",
  },
  2388024: {
    ar: "اسم القالب يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات سفلية فقط.",
    en: "Template name must contain only lowercase letters, numbers, and underscores.",
  },
  2388068: {
    ar: "عدد المتغيرات يتجاوز الحد المسموح.",
    en: "Number of variables exceeds the allowed limit.",
  },
  2388039: {
    ar: "لا يمكن تغيير حالة هذا القالب.",
    en: "This template's status cannot be changed.",
  },
  2388040: {
    ar: "أحد الحقول تجاوز الحد الأقصى للأحرف المسموح.",
    en: "A field has exceeded the maximum character limit.",
  },
  2388047: {
    ar: "العنوان يحتوي على تنسيق أو رموز غير مسموحة — استخدم سطراً واحداً بنص عادي.",
    en: "Header format is incorrect — use plain text.",
  },
  2388073: {
    ar: "التذييل يحتوي على تنسيق غير صالح.",
    en: "Footer contains invalid formatting.",
  },
  2388293: {
    ar: "القالب يحتوي على عدد كبير جداً من المتغيرات مقارنة بطوله.",
    en: "Template has too many variables relative to its length.",
  },
}

const CODE_MAP: Record<number, TemplateErrorMapping> = {
  132001: {
    ar: "القالب غير موجود أو لم تتم الموافقة عليه بعد.",
    en: "Template not found or not yet approved.",
  },
  100: {
    ar: "معلمة غير صالحة — تحقق من جميع الحقول.",
    en: "Invalid parameter — check all fields.",
  },
}

type ErrorSource = {
  code?: number | string
  subCode?: number | string | null
  userTitle?: string
  userMessage?: string
  message?: string
}

export function mapTemplateError(error: ErrorSource): string {
  const subCode =
    typeof error.subCode === "string"
      ? Number.parseInt(error.subCode, 10)
      : error.subCode

  if (subCode && SUBCODE_MAP[subCode]) {
    const mapped = SUBCODE_MAP[subCode]
    return `${mapped.ar}\n\nرمز الخطأ: ${subCode}`
  }

  const code =
    typeof error.code === "string"
      ? Number.parseInt(error.code, 10)
      : error.code

  if (code && !subCode && CODE_MAP[code]) {
    const mapped = CODE_MAP[code]
    return `${mapped.ar}\n\nرمز الخطأ: ${code}`
  }

  // Fallback: show Meta's own error messages
  if (error.userTitle || error.userMessage) {
    const parts = ["رفضت Meta القالب:"]
    if (error.userTitle) {
      parts.push(error.userTitle)
    }
    if (error.userMessage) {
      parts.push(error.userMessage)
    }
    if (subCode) {
      parts.push(`\nرمز الخطأ: ${subCode}`)
    } else if (code) {
      parts.push(`\nرمز الخطأ: ${code}`)
    }
    return parts.join(" ")
  }

  return error.message || "حدث خطأ غير متوقع أثناء إنشاء القالب."
}

function dig(
  obj: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> | null {
  let current: unknown = obj
  for (const key of keys) {
    if (typeof current !== "object" || current === null) {
      return null
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === "object" && current !== null
    ? (current as Record<string, unknown>)
    : null
}

export function extractMetaErrorDetails(error: SdkException): ErrorSource {
  const result: ErrorSource = {
    code: error.code,
    subCode: error.subCode,
    message: error.message,
  }

  const origin = error.getOriginError?.()
  if (!origin || typeof origin !== "object") {
    return result
  }

  const raw = origin as unknown as Record<string, unknown>

  const metaError =
    dig(raw, "data", "error") ??
    dig(raw, "errorBody", "error") ??
    dig(raw, "response", "error") ??
    (raw.error_user_title || raw.error_user_msg || raw.error_subcode
      ? raw
      : null)

  if (metaError) {
    if (typeof metaError.error_user_title === "string") {
      result.userTitle = metaError.error_user_title
    }
    if (typeof metaError.error_user_msg === "string") {
      result.userMessage = metaError.error_user_msg
    }
  }

  return result
}
