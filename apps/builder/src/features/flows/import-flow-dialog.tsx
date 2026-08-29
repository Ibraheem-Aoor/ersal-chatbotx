"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@chatbotx.io/ui/components/ui/dialog"
import { ImportIcon, Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAction } from "next-safe-action/hooks"
import { type ChangeEvent, useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { importFlowAction } from "./actions/import-flow.action"
import { type ImportFlowSchema, importFlowSchema } from "./schema/action"

export function ImportFlowDialog({
  workspaceId,
  folderId,
}: {
  workspaceId: string
  folderId: string | null
}) {
  const t = useTranslations()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ImportFlowSchema | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { execute, isPending } = useAction(
    importFlowAction.bind(null, workspaceId),
    {
      onSuccess: ({ data }) => {
        toast.success(
          t("messages.importSuccess", { feature: t("fields.flow.label") }),
        )
        setOpen(false)
        resetState()
        if (data?.id) {
          router.refresh()
        }
      },
      onError: ({ error }) => {
        if (error.serverError) {
          toast.error(error.serverError)
        }
      },
    },
  )

  const resetState = useCallback(() => {
    setParsedData(null)
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setParseError(null)
      setParsedData(null)

      const file = event.target.files?.[0]
      if (!file) {
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string)
          const result = importFlowSchema.safeParse(raw)
          if (result.success) {
            setParsedData(result.data)
          } else {
            const firstError = result.error.issues[0]
            setParseError(
              firstError
                ? `${firstError.path.join(".")}: ${firstError.message}`
                : t("messages.invalidFile"),
            )
          }
        } catch {
          setParseError(t("messages.invalidFile"))
        }
      }
      reader.readAsText(file)
    },
    [t],
  )

  const onSubmit = useCallback(() => {
    if (!parsedData) return
    execute({
      ...parsedData,
      folderId: folderId ?? undefined,
    })
  }, [parsedData, folderId, execute])

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetState()
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <ImportIcon />
            {t("actions.import")}
          </Button>
        }
      />
      <DialogContent className="max-h-screen max-w-sm overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {t("messages.importFeature", { feature: t("fields.flow.label") })}
          </DialogTitle>
          <DialogDescription>
            {t("messages.importFlowDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              accept=".json"
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground file:text-sm hover:file:bg-primary/90"
              onChange={onFileChange}
              type="file"
            />
          </div>

          {parseError && (
            <p className="text-destructive text-sm">{parseError}</p>
          )}

          {parsedData && (
            <div className="rounded-md border p-3 text-sm">
              <p>
                <span className="font-medium">{t("fields.name.label")}:</span>{" "}
                {parsedData.name}
              </p>
              <p>
                {parsedData.nodes.length} {t("fields.steps.label").toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="ghost">
                {t("actions.cancel")}
              </Button>
            }
          />
          <Button
            disabled={!parsedData || isPending}
            onClick={onSubmit}
            type="button"
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {t("actions.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
