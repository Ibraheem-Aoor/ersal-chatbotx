import { SiFacebook, SiMake } from "@icons-pack/react-simple-icons"
import { BotIcon, CodeIcon } from "lucide-react"
import type { ComponentType } from "react"
import {
  ActiveCampaignIcon,
  ClaudeIcon,
  DeepSeekIcon,
  DripIcon,
  GeminiIcon,
  GetResponseIcon,
  GoogleSheetsIcon,
  KlaviyoIcon,
  MailchimpIcon,
  MailerLiteIcon,
  MoosendIcon,
  OpenAIIcon,
  OpenRouterIcon,
  SendGridIcon,
} from "@/features/integrations/integration-icons"

/**
 * Ordered registry of the workspace-settings integration providers, following
 * the `CHANNEL_CAPABILITIES` pattern in `@chatbotx.io/utils`.
 *
 * `slug` is the single source of truth for BOTH the route directory name
 * (`settings/integrations/<slug>/page.tsx`) and the accordion's active-segment
 * matching (`useSelectedLayoutSegment()`), so a mismatch between a row and its
 * page cannot silently happen — the row simply 404s. Adding a provider means
 * adding one entry here plus one `page.tsx`; the shared settings route no
 * longer grows with each provider.
 *
 * `titleKey` values are existing message keys in `apps/builder/messages/*` —
 * do not add new keys here without adding the translations first.
 */
export type IntegrationSettingsEntry = {
  /** Kebab-case route segment under `settings/integrations/`. */
  slug: string
  /** `next-intl` message key for the row title (must already exist). */
  titleKey: string
  icon: ComponentType<{ size?: number | string }>
}

export const INTEGRATION_SETTINGS_REGISTRY: readonly IntegrationSettingsEntry[] =
  [
    {
      slug: "workspace-token",
      titleKey: "workspaceToken.title",
      icon: CodeIcon,
    },
    { slug: "openai", titleKey: "openai.title", icon: OpenAIIcon },
    { slug: "gemini", titleKey: "gemini.title", icon: GeminiIcon },
    { slug: "claude", titleKey: "claude.title", icon: ClaudeIcon },
    { slug: "deepseek", titleKey: "deepseek.title", icon: DeepSeekIcon },
    { slug: "openrouter", titleKey: "openrouter.title", icon: OpenRouterIcon },
    {
      slug: "openai-compatible",
      titleKey: "openaiCompatible.title",
      icon: BotIcon,
    },
    {
      slug: "google-sheets",
      titleKey: "googleSheets.title",
      icon: GoogleSheetsIcon,
    },
    { slug: "facebook-ads", titleKey: "facebookAds.title", icon: SiFacebook },
    { slug: "make", titleKey: "make.title", icon: SiMake },
    {
      slug: "active-campaign",
      titleKey: "activeCampaign.title",
      icon: ActiveCampaignIcon,
    },
    {
      slug: "get-response",
      titleKey: "getResponse.title",
      icon: GetResponseIcon,
    },
    { slug: "mailchimp", titleKey: "mailchimp.title", icon: MailchimpIcon },
    {
      slug: "mailer-lite",
      titleKey: "mailerLite.title",
      icon: MailerLiteIcon,
    },
    { slug: "moosend", titleKey: "moosend.title", icon: MoosendIcon },
    { slug: "drip", titleKey: "drip.title", icon: DripIcon },
    { slug: "sendgrid", titleKey: "sendGrid.title", icon: SendGridIcon },
    { slug: "klaviyo", titleKey: "klaviyo.title", icon: KlaviyoIcon },
  ]
