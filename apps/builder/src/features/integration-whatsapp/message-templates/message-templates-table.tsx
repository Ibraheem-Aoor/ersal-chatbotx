"use client"

import { Badge } from "@chatbotx.io/ui/components/ui/badge"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@chatbotx.io/ui/components/ui/table"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import React from "react"
import type { IntegrationWhatsappLinkable } from "@/features/integration-whatsapp/queries"
import { EditMessageTemplateDialog } from "./create-message-template-dialog"
import { WhatsappMessageTemplatesTableToolbarActions } from "./message-templates-table-toolbar-actions"
import type { WhatsappMessageTemplateResource } from "./schema/resource"

type WhatsappMessageTemplatesTableProps = {
  integrationWhatsapp: IntegrationWhatsappLinkable
  promises: Promise<WhatsappMessageTemplateResource[]>
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations()
  const statusKey = status as keyof typeof statusVariantMap

  const statusVariantMap = {
    APPROVED: "default" as const,
    PENDING: "secondary" as const,
    REJECTED: "destructive" as const,
  }

  const statusClassMap: Record<string, string> = {
    APPROVED:
      "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    PENDING:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    REJECTED:
      "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  }

  const translatedStatus =
    status === "APPROVED" || status === "PENDING" || status === "REJECTED"
      ? t(`whatsapp.messageTemplate.status.${status}`)
      : status

  return (
    <Badge
      className={statusClassMap[statusKey] ?? ""}
      variant={statusVariantMap[statusKey] ?? "secondary"}
    >
      {translatedStatus}
    </Badge>
  )
}

export function WhatsappMessageTemplatesTable({
  integrationWhatsapp,
  promises,
}: WhatsappMessageTemplatesTableProps) {
  const t = useTranslations()
  const data = React.use(promises)

  return (
    <div className="flex flex-col gap-4">
      {/* Top toolbar: Manage link + Create/Sync buttons */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="secondary">
          <Link
            href={`https://business.facebook.com/latest/whatsapp_manager/message_templates?business_id=${integrationWhatsapp.businessId}&asset_id=${integrationWhatsapp.wabaId}`}
            target="_blank"
          >
            {t("actions.manage")}
          </Link>
        </Button>
        <WhatsappMessageTemplatesTableToolbarActions
          integrationWhatsappId={integrationWhatsapp.id}
          workspaceId={integrationWhatsapp.workspaceId}
        />
      </div>

      {/* Templates table */}
      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name.label")}</TableHead>
              <TableHead>{t("fields.language.label")}</TableHead>
              <TableHead>{t("fields.category.label")}</TableHead>
              <TableHead>{t("fields.status.label")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((mt) => (
              <TableRow key={mt.id}>
                <TableCell>{mt.name}</TableCell>
                <TableCell>{mt.language}</TableCell>
                <TableCell>{mt.category}</TableCell>
                <TableCell>
                  <StatusBadge status={mt.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditMessageTemplateDialog
                      integrationWhatsappId={integrationWhatsapp.id}
                      template={mt}
                      workspaceId={integrationWhatsapp.workspaceId}
                    />
                    <Link
                      href={`https://business.facebook.com/latest/whatsapp_manager/template_details/?business_id=${integrationWhatsapp.businessId}&tab=mt-edit&id=${mt.id}&nav_ref=whatsapp_manager&asset_id=${integrationWhatsapp.wabaId}`}
                      target="_blank"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell className="text-center" colSpan={5}>
                  {t("messages.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
