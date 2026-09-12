"use client"

import type { ExternalRequestStepSchema } from "@chatbotx.io/flow-config"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import { AlertCircleIcon, Loader2Icon, PlayIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useFormContext } from "react-hook-form"
import { useJsonSourceContext } from "./json-source-context"

export const TestNowPanel = () => {
  const t = useTranslations()
  const { getValues } = useFormContext<ExternalRequestStepSchema>()
  const { execute, isPending, testResult, testError } = useJsonSourceContext()

  const handleTestNow = () => {
    const { method, url, headers, body } = getValues()
    execute({ method, url, headers, body })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={isPending}
        onClick={handleTestNow}
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? (
          <Loader2Icon className="me-2 size-4 animate-spin" />
        ) : (
          <PlayIcon className="me-2 size-4" />
        )}
        {t("actions.testNow")}
      </Button>

      {testResult && (
        <div className="flex flex-col gap-1 rounded-md border bg-muted/50 p-3 text-xs">
          <div className="flex gap-2 font-medium">
            <span>
              {t("fields.statusCode.label")}: {testResult.statusCode}
            </span>
            <span>{testResult.durationMs}ms</span>
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">
            {testResult.responseBody}
          </pre>
        </div>
      )}

      {!testResult && testError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>{t("messages.testRequestFailed")}</span>
        </div>
      )}
    </div>
  )
}
