import { UiProvider } from "@chatbotx.io/ui"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import type { ReactNode } from "react"
import { PublicEnvScript } from "@/components/public-env-script"
import { SupportChatScript } from "@/components/support-chat-script"
import { ZodErrorMapProvider } from "@/components/zod-error-map-provider"
import { env } from "@/env"
import { TenantProvider } from "@/features/tenant"
import { getTenantSettings } from "@/features/tenant/utils"
import { getDirection } from "@/i18n/direction"
import { getDomainFromHeader } from "@/lib/domain"
import "./globals.css"
import "./themes.css"
import { DirectionProvider } from "@chatbotx.io/ui/components/ui/direction"

const thmanyahSans = localFont({
  src: [
    {
      path: "../../public/fonts/thmanyah/thmanyahsans-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/thmanyahsans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/thmanyahsans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/thmanyahsans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/thmanyah/thmanyahsans-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-thmanyah",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const { name, faviconUrl } = await getTenantSettings()

  return {
    title: name,
    description: name,
    icons: [
      {
        rel: "icon",
        url: faviconUrl ?? "/brand/favicon/favicon-96x96.png",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        url: faviconUrl ?? "/brand/favicon/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
    manifest: "/brand/favicon/site.webmanifest",
  }
}

type Props = {
  children: ReactNode
}

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale()
  const dir = getDirection(locale)
  const tenantSettings = await getTenantSettings()
  const domain = await getDomainFromHeader()
  const isBuilderDomain =
    domain === new URL(env.NEXT_PUBLIC_BUILDER_URL).hostname
  const pancakeChatPageId = env.NEXT_PUBLIC_PANCAKE_CHAT_PAGE_ID

  return (
    <html
      className={thmanyahSans.variable}
      dir={dir}
      lang={locale}
      suppressHydrationWarning
    >
      <head>
        <PublicEnvScript />
        {isBuilderDomain && pancakeChatPageId && (
          <SupportChatScript pageId={pancakeChatPageId} />
        )}
      </head>
      <body
        className={
          tenantSettings.theme
            ? `theme-${tenantSettings.theme.toLowerCase()}`
            : undefined
        }
        suppressHydrationWarning
      >
        <TenantProvider settings={tenantSettings}>
          <DirectionProvider direction={dir}>
            <UiProvider>
              <NextIntlClientProvider>
                <ZodErrorMapProvider />
                {children}
              </NextIntlClientProvider>
            </UiProvider>
          </DirectionProvider>
        </TenantProvider>
      </body>
    </html>
  )
}
