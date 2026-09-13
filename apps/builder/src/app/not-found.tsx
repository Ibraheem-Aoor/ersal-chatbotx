import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function NotFoundPage() {
  const t = await getTranslations("notFound")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-6xl">404</h1>
      <h2 className="font-semibold text-xl">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link
        className="mt-4 rounded-md bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        href="/"
      >
        {t("backHome")}
      </Link>
    </div>
  )
}
