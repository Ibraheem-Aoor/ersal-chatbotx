"use client"

import type { TemplateComponent } from "@chatbotx.io/flow-config"
import { ComboboxField } from "@chatbotx.io/ui/components/form/combobox-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { CheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form"
import { useFlowSelectOptions } from "@/features/flows/provider/flow-hook"

type ButtonItem = {
  id: string
  label: string
  flowId?: string
}

export function extractWhatsappFlowButtons(
  components: TemplateComponent[],
): Array<{ id: string; label: string }> {
  const buttons: Array<{ id: string; label: string }> = []

  if (!components || components.length === 0) {
    return buttons
  }

  for (const component of components) {
    if (component.type === "BUTTONS" && component.buttons) {
      for (const [idx, button] of component.buttons.entries()) {
        if (button.type.toUpperCase() === "QUICK_REPLY") {
          buttons.push({
            id: `qr-${idx}-${(button.text ?? "").slice(0, 20)}`,
            label: button.text ?? "",
          })
        }
      }
    }
  }

  return buttons
}

type FlowDialogFormValues = {
  flowId: string
}

type FlowSelectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (flowId: string) => void
  defaultFlowId?: string
}

function FlowSelectDialog({
  open,
  onOpenChange,
  onSave,
  defaultFlowId,
}: FlowSelectDialogProps) {
  const t = useTranslations()
  const flowOptions = useFlowSelectOptions()

  const dialogForm = useForm<FlowDialogFormValues>({
    defaultValues: {
      flowId: defaultFlowId ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      dialogForm.reset({ flowId: defaultFlowId ?? "" })
    }
  }, [open, defaultFlowId, dialogForm])

  function handleSave() {
    const flowId = dialogForm.getValues("flowId")
    if (!flowId) {
      dialogForm.setError("flowId", {
        message: `${t("fields.flowId.label")} is required`,
      })
      return
    }
    onSave(flowId)
    onOpenChange(false)
  }

  function handleCancel() {
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("flows.actions.startExternalFlow")}</DialogTitle>
        </DialogHeader>

        <FormProvider {...dialogForm}>
          <div className="py-2">
            <ComboboxField
              emptyText={t("actions.noRecordFound")}
              label={t("fields.flowId.label")}
              name="flowId"
              options={flowOptions}
              placeholder={t("actions.pleaseSelect")}
              required={true}
            />
          </div>
        </FormProvider>

        <DialogFooter>
          <Button onClick={handleCancel} type="button" variant="outline">
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleSave} type="button">
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WhatsappBroadcastFlowButtons() {
  const { setValue, control } = useFormContext()

  const buttons = useWatch({ control, name: "buttons" }) as
    | ButtonItem[]
    | undefined

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  if (!buttons || buttons.length === 0) {
    return null
  }

  function handleButtonClick(index: number) {
    setEditingIndex(index)
    setDialogOpen(true)
  }

  function handleSave(flowId: string) {
    if (editingIndex !== null) {
      setValue(`buttons.${editingIndex}.flowId`, flowId)
    }
    setEditingIndex(null)
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingIndex(null)
    }
  }

  const editingButton =
    editingIndex === null ? undefined : buttons[editingIndex]

  return (
    <div className="flex w-full flex-col gap-2">
      {buttons.map((button, index) => (
        <Button
          className="w-full justify-between hover:text-blue-500"
          key={button.id}
          onClick={() => handleButtonClick(index)}
          type="button"
          variant="secondary"
        >
          <span>{button.label}</span>
          {button.flowId && <CheckIcon className="h-4 w-4 text-green-500" />}
        </Button>
      ))}

      {dialogOpen && editingIndex !== null && (
        <FlowSelectDialog
          defaultFlowId={editingButton?.flowId}
          onOpenChange={handleDialogOpenChange}
          onSave={handleSave}
          open={dialogOpen}
        />
      )}
    </div>
  )
}
