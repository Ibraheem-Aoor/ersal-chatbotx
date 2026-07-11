"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SwitchField } from "@chatbotx.io/ui/components/form/switch-field"
import { TextareaField } from "@chatbotx.io/ui/components/form/textarea-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { createPlanAction } from "../actions/create-plan.action"
import { updatePlanAction } from "../actions/update-plan.action"
import { type CreatePlanInput, createPlanSchema } from "../schema/plan"

type PlanRow = {
  id: string
  name: string
  description: string | null
  price: string
  limits: CreatePlanInput["limits"]
  features: string[]
  isActive: boolean
  sortOrder: number
}

export function PlanFormDialog({
  plan,
  trigger,
}: {
  plan?: PlanRow
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()
  const router = useRouter()
  const isEditing = !!plan

  const action = isEditing
    ? updatePlanAction.bind(null, plan.id)
    : createPlanAction

  const { form, handleSubmitWithAction, resetFormAndAction } =
    useHookFormAction(action, zodResolver(createPlanSchema), {
      actionProps: {
        onSuccess: () => {
          setOpen(false)
          router.refresh()
          toast.success(
            isEditing
              ? t("plans.messages.updated")
              : t("plans.messages.created"),
          )
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError)
          }
        },
      },
      formProps: {
        mode: "onChange",
        defaultValues: {
          name: plan?.name ?? "",
          description: plan?.description ?? "",
          price: plan?.price ?? "0.00",
          limits: plan?.limits ?? {
            contacts: 500,
            mac: 1000,
            workspaces: 1,
            channels: 3,
            teamMembers: 2,
            flows: 5,
            broadcasts: false,
            aiAgents: false,
            removeBranding: false,
          },
          features: plan?.features ?? [],
          isActive: plan?.isActive ?? true,
          sortOrder: plan?.sortOrder ?? 0,
        },
      },
    })

  const features = form.watch("features")

  const [newFeature, setNewFeature] = useState("")

  function addFeature() {
    const trimmed = newFeature.trim()
    if (!trimmed) {
      return
    }
    const current = form.getValues("features")
    form.setValue("features", [...current, trimmed])
    setNewFeature("")
  }

  function removeFeature(feature: string) {
    const current = form.getValues("features")
    const index = current.indexOf(feature)
    if (index === -1) {
      return
    }
    form.setValue(
      "features",
      current.filter((_, i) => i !== index),
    )
  }

  return (
    <Dialog
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          resetFormAndAction()
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle>
          {isEditing ? t("plans.editPlan") : t("plans.createPlan")}
        </DialogTitle>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmitWithAction}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label={t("plans.fields.name")} name="name" required />
              <InputField
                label={t("plans.fields.price")}
                name="price"
                required
                type="text"
              />
            </div>

            <TextareaField
              label={t("plans.fields.description")}
              name="description"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label={t("plans.fields.sortOrder")}
                name="sortOrder"
                type="number"
              />
              <SwitchField label={t("plans.fields.isActive")} name="isActive" />
            </div>

            <h4 className="mt-2 font-semibold text-sm">
              {t("plans.limits.title")}
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InputField
                label={t("plans.limits.contacts")}
                name="limits.contacts"
                type="number"
              />
              <InputField
                label={t("plans.limits.mac")}
                name="limits.mac"
                type="number"
              />
              <InputField
                label={t("plans.limits.workspaces")}
                name="limits.workspaces"
                type="number"
              />
              <InputField
                label={t("plans.limits.channels")}
                name="limits.channels"
                type="number"
              />
              <InputField
                label={t("plans.limits.teamMembers")}
                name="limits.teamMembers"
                type="number"
              />
              <InputField
                label={t("plans.limits.flows")}
                name="limits.flows"
                type="number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <SwitchField
                label={t("plans.limits.broadcasts")}
                name="limits.broadcasts"
              />
              <SwitchField
                label={t("plans.limits.aiAgents")}
                name="limits.aiAgents"
              />
              <SwitchField
                label={t("plans.limits.removeBranding")}
                name="limits.removeBranding"
              />
            </div>

            <h4 className="mt-2 font-semibold text-sm">
              {t("plans.features.title")}
            </h4>
            <div className="flex gap-2">
              <Input
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFeature()
                  }
                }}
                placeholder={t("plans.features.addPlaceholder")}
                value={newFeature}
              />
              <Button
                onClick={addFeature}
                size="icon"
                type="button"
                variant="outline"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
            {features.length > 0 && (
              <ul className="flex flex-col gap-1">
                {features.map((feature) => (
                  <li
                    className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
                    key={feature}
                  >
                    <span>{feature}</span>
                    <Button
                      className="size-6"
                      onClick={() => removeFeature(feature)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  resetFormAndAction()
                  setOpen(false)
                }}
                type="button"
                variant="outline"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {isEditing ? t("actions.save") : t("plans.createPlan")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
