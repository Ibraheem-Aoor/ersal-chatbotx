"use client"

import {
  type ChannelType,
  channelTypes,
  contactImportFields,
  importTypes,
  uploadTypes,
} from "@chatbotx.io/database/partials"
import { matchContactImportHeaders } from "@chatbotx.io/imports"
import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SelectField } from "@chatbotx.io/ui/components/form/select-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { Loader2Icon, UsersIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { getBrowserTimezone } from "@/features/contact-filter/lib/timezone"
import { importContactsAction } from "@/features/contacts/actions/import-contacts.action"
import { importContactsRequest } from "@/features/contacts/schemas/contact-import"
import { ImportDropzone } from "@/features/import/components/import-dropzone"
import { useInboxOptionsByChannel } from "@/features/inboxes/provider/inbox-hook"

type BroadcastAudienceImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  channel: string
  tagId: string
  tagName: string
  onImportStarted: () => void
}

const LINE_BREAK_RE = /\r?\n/

async function countCsvRows(file: File): Promise<number> {
  const text = await file.text()
  const lines = text
    .split(LINE_BREAK_RE)
    .filter((line) => line.trim().length > 0)
  return Math.max(0, lines.length - 1)
}

export function BroadcastAudienceImportDialog({
  open,
  onOpenChange,
  workspaceId,
  channel,
  tagId,
  tagName,
  onImportStarted,
}: BroadcastAudienceImportDialogProps) {
  const t = useTranslations()
  const [fileId, setFileId] = useState("")
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const hasFile = fileId !== ""

  const { form, handleSubmitWithAction } = useHookFormAction(
    importContactsAction.bind(null, workspaceId),
    zodResolver(importContactsRequest),
    {
      actionProps: {
        onSuccess: () => {
          toast.success(t("broadcasts.audienceImport.importStarted"))
          onImportStarted()
          onOpenChange(false)
          setFileId("")
          setCsvHeaders([])
          setRowCount(null)
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError)
            return
          }
          const rootErrors = error.validationErrors?._errors
          if (rootErrors?.length) {
            toast.error(rootErrors[0])
            return
          }
          toast.error(t("broadcasts.audienceImport.importFailed"))
        },
      },
      formProps: {
        mode: "onChange",
        defaultValues: {
          fileId: "",
          inboxId: "",
          channel: channel as ChannelType,
          tagId,
          timezone: getBrowserTimezone(),
          countryCode: undefined,
        },
      },
      errorMapProps: {},
    },
  )

  const applyHeaderMapping = (headers: string[]) => {
    const columnByField = matchContactImportHeaders(headers)
    for (const field of contactImportFields.options) {
      form.setValue(field, columnByField[field], { shouldValidate: true })
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("broadcasts.audienceImport.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ImportDropzone
            onCleared={() => {
              setFileId("")
              setCsvHeaders([])
              setRowCount(null)
              applyHeaderMapping([])
            }}
            onFileSelected={(file) => {
              countCsvRows(file)
                .then(setRowCount)
                .catch(() => setRowCount(null))
            }}
            onUploaded={(result, headers) => {
              setFileId(result.fileId)
              setCsvHeaders(headers)
              applyHeaderMapping(headers)
              form.setValue("fileId", result.fileId, {
                shouldValidate: true,
              })
            }}
            onUploadingChange={setIsUploading}
            subType={importTypes.enum.contacts}
            type={uploadTypes.enum.import}
            workspaceId={workspaceId}
          />

          {hasFile && rowCount !== null && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/40">
              <UsersIcon className="size-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 text-sm dark:text-green-300">
                {t("broadcasts.audienceImport.rowCount", {
                  count: rowCount,
                })}
              </span>
            </div>
          )}

          {hasFile && (
            <Form {...form}>
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.stopPropagation()
                  handleSubmitWithAction(e)
                }}
              >
                <ImportDialogSettings
                  channel={channel}
                  csvHeaders={csvHeaders}
                />
                <p className="text-muted-foreground text-xs">
                  {t("broadcasts.audienceImport.tagNote", {
                    tag: tagName,
                  })}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => onOpenChange(false)}
                    type="button"
                    variant="outline"
                  >
                    {t("actions.cancel")}
                  </Button>
                  <Button
                    disabled={
                      isUploading ||
                      !form.formState.isValid ||
                      form.formState.isSubmitting
                    }
                    type="submit"
                  >
                    {form.formState.isSubmitting && (
                      <Loader2Icon className="animate-spin" />
                    )}
                    {t("broadcasts.audienceImport.startImport")}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ImportDialogSettings({
  channel,
  csvHeaders,
}: {
  channel: string
  csvHeaders: string[]
}) {
  const t = useTranslations()
  const inboxOptions = useInboxOptionsByChannel(channel)

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label={t("fields.inbox.label")}
        name="inboxId"
        options={inboxOptions}
        required
      />
      {channel === channelTypes.enum.whatsapp && (
        <InputField
          label={t("fields.countryCode.label")}
          name="countryCode"
          placeholder="+1"
        />
      )}
      {csvHeaders.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-medium text-sm">
            {t("broadcasts.audienceImport.columnMapping")}
          </span>
          <ImportHeaderField
            csvHeaders={csvHeaders}
            label={t("fields.phoneNumber.label")}
            name="phoneNumber"
          />
          <ImportHeaderField
            csvHeaders={csvHeaders}
            label={t("fields.firstName.label")}
            name="firstName"
          />
          <ImportHeaderField
            csvHeaders={csvHeaders}
            label={t("fields.lastName.label")}
            name="lastName"
          />
        </div>
      )}
    </div>
  )
}

function ImportHeaderField({
  csvHeaders,
  name,
  label,
}: {
  csvHeaders: string[]
  name: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <SelectField
          allowClear
          key={csvHeaders.join("")}
          name={name}
          options={csvHeaders.map((col) => ({ label: col, value: col }))}
        />
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}
