"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@chatbotx.io/ui/components/ui/accordion"
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
import { BotIcon, CodeIcon } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

const COMPOSIO_LOGO_BASE = "https://logos.composio.dev/api"

function ComposioLogo({ provider }: { provider: string }) {
  return (
    <Image
      alt=""
      className="size-6 shrink-0 rounded"
      height={24}
      src={`${COMPOSIO_LOGO_BASE}/${provider}`}
      unoptimized
      width={24}
    />
  )
}

type SettingIntegrationLayoutProps = {
  workspaceToken?: ReactNode
  openAI?: ReactNode
  gemini?: ReactNode
  claude?: ReactNode
  deepSeek?: ReactNode
  openRouter?: ReactNode
  openaiCompatible?: ReactNode
  googleSheets?: ReactNode
  activeCampaign?: ReactNode
  getResponse?: ReactNode
  mailchimp?: ReactNode
  mailerLite?: ReactNode
  moosend?: ReactNode
  drip?: ReactNode
  sendGrid?: ReactNode
  klaviyo?: ReactNode
}

export default function SettingIntegrationLayout({
  workspaceToken,
  openAI,
  gemini,
  claude,
  deepSeek,
  openRouter,
  openaiCompatible,
  googleSheets,
  activeCampaign,
  getResponse,
  mailchimp,
  mailerLite,
  moosend,
  drip,
  sendGrid,
  klaviyo,
}: SettingIntegrationLayoutProps) {
  const t = useTranslations()

  const integrationItems: {
    keyName: string
    icon: ReactNode
    content: ReactNode
  }[] = [
    {
      keyName: t("workspaceToken.title"),
      icon: <CodeIcon className="size-6 shrink-0" />,
      content: workspaceToken,
    },
    {
      keyName: t("openai.title"),
      icon: <ComposioLogo provider="openai" />,
      content: openAI,
    },
    {
      keyName: t("gemini.title"),
      icon: (
        <SiGooglegemini className="size-6 shrink-0" fill={SiGooglegeminiHex} />
      ),
      content: gemini,
    },
    {
      keyName: t("claude.title"),
      icon: (
        <SiAnthropic
          className="size-6 shrink-0 dark:fill-zinc-100"
          fill={SiAnthropicHex}
        />
      ),
      content: claude,
    },
    {
      keyName: t("deepseek.title"),
      icon: <ComposioLogo provider="deepseek" />,
      content: deepSeek,
    },
    {
      keyName: t("openrouter.title"),
      icon: <SiOpenrouter className="size-6 shrink-0" fill={SiOpenrouterHex} />,
      content: openRouter,
    },
    {
      keyName: t("openaiCompatible.title"),
      icon: <BotIcon className="size-6 shrink-0" />,
      content: openaiCompatible,
    },
    {
      keyName: t("googleSheets.title"),
      icon: (
        <SiGooglesheets className="size-6 shrink-0" fill={SiGooglesheetsHex} />
      ),
      content: googleSheets,
    },
    {
      keyName: t("activeCampaign.title"),
      icon: <ComposioLogo provider="active_campaign" />,
      content: activeCampaign,
    },
    {
      keyName: t("getResponse.title"),
      icon: <ComposioLogo provider="getresponse" />,
      content: getResponse,
    },
    {
      keyName: t("mailchimp.title"),
      icon: <SiMailchimp className="size-6 shrink-0" fill={SiMailchimpHex} />,
      content: mailchimp,
    },
    {
      keyName: t("mailerLite.title"),
      icon: <ComposioLogo provider="mailerlite" />,
      content: mailerLite,
    },
    {
      keyName: t("moosend.title"),
      icon: <ComposioLogo provider="moosend" />,
      content: moosend,
    },
    {
      keyName: t("drip.title"),
      icon: (
        <Image
          alt=""
          className="size-6 shrink-0 rounded"
          height={24}
          src="https://www.drip.com/hubfs/logo-magenta-circle-inverse.png"
          unoptimized
          width={24}
        />
      ),
      content: drip,
    },
    {
      keyName: t("sendGrid.title"),
      icon: <ComposioLogo provider="sendgrid" />,
      content: sendGrid,
    },
    {
      keyName: t("klaviyo.title"),
      icon: <ComposioLogo provider="Klaviyo" />,
      content: klaviyo,
    },
  ]

  return (
    <Accordion className="w-full" collapsible type="single">
      {integrationItems.map((integration) => (
        <AccordionItem
          className="transition-all hover:data-[state=open]:rounded-none"
          key={integration.keyName}
          value={integration.keyName}
        >
          <AccordionTrigger className="rounded-none px-4 transition-all hover:bg-muted hover:no-underline data-[state=open]:bg-muted">
            <div className="flex items-center gap-2">
              {integration.icon}
              {integration.keyName}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            {integration.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
