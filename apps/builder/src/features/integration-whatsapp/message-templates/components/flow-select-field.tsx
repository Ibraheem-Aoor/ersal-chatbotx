"use client"

import { SelectField } from "@chatbotx.io/ui/components/form/select-field"
import { Loader2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useMemo, useState } from "react"
import { listWhatsappFlowsForTemplateAction } from "../actions/list-flows.action"
import { useWhatsappTemplateDialog } from "../context"

type FlowOption = {
  sourceId: string
  name: string
  status: string
}

export function FlowSelectField({ name }: { name: string }) {
  const t = useTranslations()
  const { workspaceId, integrationWhatsappId } = useWhatsappTemplateDialog()
  const [flows, setFlows] = useState<FlowOption[]>([])
  const [loaded, setLoaded] = useState(false)

  const { execute, isPending } = useAction(
    listWhatsappFlowsForTemplateAction.bind(
      null,
      workspaceId,
      integrationWhatsappId,
    ),
    {
      onSuccess({ data }) {
        if (data) {
          setFlows(data)
        }
        setLoaded(true)
      },
      onError() {
        setLoaded(true)
      },
    },
  )

  useEffect(() => {
    execute()
  }, [execute])

  const options = useMemo(
    () =>
      flows.map((f) => ({
        value: f.sourceId,
        label: `${f.name}${f.status === "PUBLISHED" ? "" : ` (${f.status})`}`,
      })),
    [flows],
  )

  if (isPending && !loaded) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
        <Loader2Icon className="size-3.5 animate-spin" />
        {t("actions.loading")}
      </div>
    )
  }

  if (loaded && flows.length === 0) {
    return (
      <p className="py-2 text-muted-foreground text-xs">
        {t("whatsapp.messageTemplate.noFlowsAvailable")}
      </p>
    )
  }

  return (
    <SelectField
      label={t("fields.whatsappFlow.label")}
      name={name}
      options={options}
      placeholder={t("actions.pleaseSelect")}
    />
  )
}
