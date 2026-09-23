import { describe, expect, test } from "vitest"
import { buttonStepSchema } from "@/features/integration-whatsapp/message-templates/templates/button/schema"

describe("buttonStepSchema — required field validation", () => {
  test("rejects empty button text", () => {
    const result = buttonStepSchema.safeParse({
      text: "",
      type: "quickReply",
    })
    expect(result.success).toBe(false)
  })

  test("rejects empty URL", () => {
    const result = buttonStepSchema.safeParse({
      text: "Visit",
      type: "url",
      url: "",
      urlDynamic: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const urlIssues = result.error.issues.filter((i) =>
        i.path.includes("url"),
      )
      expect(urlIssues.length).toBeGreaterThan(0)
    }
  })

  test("rejects empty URL sample value when dynamic URL is enabled", () => {
    const result = buttonStepSchema.safeParse({
      text: "Track",
      type: "url",
      url: "https://example.com/order/{{1}}",
      urlDynamic: true,
      urlSampleValue: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const sampleIssues = result.error.issues.filter((i) =>
        i.path.includes("urlSampleValue"),
      )
      expect(sampleIssues.length).toBeGreaterThan(0)
      expect(sampleIssues[0]?.message).toBe(
        "القيمة النموذجية مطلوبة للروابط الديناميكية",
      )
    }
  })

  test("rejects empty phone number", () => {
    const result = buttonStepSchema.safeParse({
      text: "Call us",
      type: "phoneNumber",
      phone_number: "",
    })
    expect(result.success).toBe(false)
  })

  test("rejects empty copy-code example", () => {
    const result = buttonStepSchema.safeParse({
      text: "Copy",
      type: "copyCode",
      example: "",
    })
    expect(result.success).toBe(false)
  })

  test("accepts valid URL button", () => {
    const result = buttonStepSchema.safeParse({
      text: "Visit",
      type: "url",
      url: "https://example.com",
      urlDynamic: false,
    })
    expect(result.success).toBe(true)
  })

  test("accepts valid dynamic URL with sample", () => {
    const result = buttonStepSchema.safeParse({
      text: "Track",
      type: "url",
      url: "https://example.com/order/{{1}}",
      urlDynamic: true,
      urlSampleValue: "abc123",
    })
    expect(result.success).toBe(true)
  })

  test("URL validation returns Arabic error message", () => {
    const result = buttonStepSchema.safeParse({
      text: "Visit",
      type: "url",
      url: "not-a-url",
      urlDynamic: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const urlIssues = result.error.issues.filter((i) =>
        i.path.includes("url"),
      )
      expect(urlIssues[0]?.message).toBe("صيغة الرابط غير صحيحة")
    }
  })
})
