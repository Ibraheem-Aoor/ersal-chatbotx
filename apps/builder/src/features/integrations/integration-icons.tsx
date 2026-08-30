/**
 * FORK PATCH: Official provider icons for the integrations settings page.
 *
 * Uses `@icons-pack/react-simple-icons` where available, and the Composio
 * public logo API (`logos.composio.dev`) for providers without a simple-icon.
 * Each export is a React component matching the `{ size?: number | string }`
 * signature expected by `IntegrationSettingsEntry["icon"]`.
 *
 * Originally applied in commit 5dbdfe2c1, lost during the accordion-shell
 * refactor (8b6a0c527), and restored here for the new registry pattern.
 */
import {
  SiAnthropic,
  SiAnthropicHex,
  SiGooglegemini,
  SiGooglegeminiHex,
  SiGooglesheets,
  SiGooglesheetsHex,
  SiMailchimp,
  SiMailchimpHex,
  SiOpenrouter,
  SiOpenrouterHex,
} from "@icons-pack/react-simple-icons"
import Image from "next/image"
import type { ComponentType } from "react"

// ---------------------------------------------------------------------------
// Composio logo wrapper — used for providers without a simple-icon export
// ---------------------------------------------------------------------------

const COMPOSIO_LOGO_BASE = "https://logos.composio.dev/api"

function makeComposioIcon(
  provider: string,
): ComponentType<{ size?: number | string }> {
  function ComposioIcon({ size = 24 }: { size?: number | string }) {
    const px = typeof size === "string" ? Number.parseInt(size, 10) || 24 : size
    return (
      <Image
        alt=""
        className="shrink-0 rounded"
        height={px}
        src={`${COMPOSIO_LOGO_BASE}/${provider}`}
        style={{ width: px, height: px }}
        unoptimized
        width={px}
      />
    )
  }
  ComposioIcon.displayName = `ComposioIcon(${provider})`
  return ComposioIcon
}

// ---------------------------------------------------------------------------
// Simple-icon wrappers — pass through `size` and apply the brand hex color
// ---------------------------------------------------------------------------

function makeSimpleIcon(
  Icon: ComponentType<{
    size?: number | string
    fill?: string
    className?: string
  }>,
  hex: string,
  extraClass?: string,
): ComponentType<{ size?: number | string }> {
  function BrandIcon({ size = 24 }: { size?: number | string }) {
    return (
      <Icon
        className={`shrink-0 ${extraClass ?? ""}`.trim()}
        fill={hex}
        size={size}
      />
    )
  }
  BrandIcon.displayName = `BrandIcon(${Icon.displayName ?? "unknown"})`
  return BrandIcon
}

// ---------------------------------------------------------------------------
// Exports (one per provider)
// ---------------------------------------------------------------------------

// AI providers
export const OpenAIIcon = makeComposioIcon("openai")
export const GeminiIcon = makeSimpleIcon(SiGooglegemini, SiGooglegeminiHex)
export const ClaudeIcon = makeSimpleIcon(
  SiAnthropic,
  SiAnthropicHex,
  "dark:fill-zinc-100",
)
export const DeepSeekIcon = makeComposioIcon("deepseek")
export const OpenRouterIcon = makeSimpleIcon(SiOpenrouter, SiOpenrouterHex)

// Productivity
export const GoogleSheetsIcon = makeSimpleIcon(
  SiGooglesheets,
  SiGooglesheetsHex,
)

// Email / marketing
export const ActiveCampaignIcon = makeComposioIcon("active_campaign")
export const GetResponseIcon = makeComposioIcon("getresponse")
export const MailchimpIcon = makeSimpleIcon(SiMailchimp, SiMailchimpHex)
export const MailerLiteIcon = makeComposioIcon("mailerlite")
export const MoosendIcon = makeComposioIcon("moosend")
export const SendGridIcon = makeComposioIcon("sendgrid")
export const KlaviyoIcon = makeComposioIcon("Klaviyo")

// Drip — Composio doesn't carry this logo; use their own hosted asset.
export function DripIcon({ size = 24 }: { size?: number | string }) {
  const px = typeof size === "string" ? Number.parseInt(size, 10) || 24 : size
  return (
    <Image
      alt=""
      className="shrink-0 rounded"
      height={px}
      src="https://www.drip.com/hubfs/logo-magenta-circle-inverse.png"
      style={{ width: px, height: px }}
      unoptimized
      width={px}
    />
  )
}
