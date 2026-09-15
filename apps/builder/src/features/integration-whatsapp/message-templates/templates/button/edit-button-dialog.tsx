"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { SelectField } from "@chatbotx.io/ui/components/form/select-field"
import { SwitchField } from "@chatbotx.io/ui/components/form/switch-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import {
  type ButtonStepProps,
  buttonActionTypes,
  buttonStepSchema,
} from "./schema"

export function EditButtonDialog({
  parentName,
  open,
  onOpenChange,
  changeType = true,
}: {
  parentName: string
  open: boolean
  onOpenChange: (val: boolean) => void
  changeType?: boolean
}) {
  const t = useTranslations()

  const { setValue: setValueOriginEditor, getValues: getValuesOriginEditor } =
    useFormContext()

  const form = useForm<ButtonStepProps>({
    resolver: zodResolver(buttonStepSchema),
    defaultValues: getValuesOriginEditor(parentName),
    mode: "onChange",
  })

  const buttonOptions = useMemo(
    () => [
      { label: t("fields.url.label"), value: buttonActionTypes.enum.url },
      {
        label: t("fields.quickReply.label"),
        value: buttonActionTypes.enum.quickReply,
      },
      {
        label: t("fields.phoneNumber.label"),
        value: buttonActionTypes.enum.phoneNumber,
      },
      {
        label: t("fields.whatsappFlow.label"),
        value: buttonActionTypes.enum.flow,
      },
      {
        label: t("whatsapp.messageTemplate.buttonType.copyCode"),
        value: buttonActionTypes.enum.copyCode,
      },
    ],
    [t],
  )

  const { formState, handleSubmit } = form
  const type = useWatch({ name: "type", control: form.control })
  const urlDynamic = useWatch({ name: "urlDynamic", control: form.control })

  const onSubmit = handleSubmit((data) => {
    setValueOriginEditor(parentName, data)
    onOpenChange(false)
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={"max-h-screen max-w-lg overflow-y-scroll"}>
        <DialogHeader>
          <DialogTitle>
            {t("messages.editFeature", { feature: t("fields.button.label") })}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <Form {...form}>
          <form className="flex-1 space-y-4" onSubmit={onSubmit}>
            <InputField
              description={`${(form.watch("text") || "").length}/100`}
              label={t("fields.text.label")}
              name="text"
            />
            {changeType && (
              <SelectField
                label={t("fields.button.whenPressed")}
                name="type"
                options={buttonOptions}
              />
            )}
            {type === buttonActionTypes.enum.url && (
              <>
                <InputField
                  description={t("whatsapp.messageTemplate.dynamicUrl.urlHint")}
                  label={t("fields.url.label")}
                  name="url"
                  placeholder={
                    urlDynamic
                      ? "https://example.com/order/{{1}}"
                      : "https://example.com"
                  }
                />
                <SwitchField
                  description={t(
                    "whatsapp.messageTemplate.dynamicUrl.description",
                  )}
                  label={t("whatsapp.messageTemplate.dynamicUrl.label")}
                  name="urlDynamic"
                />
                {urlDynamic && (
                  <InputField
                    description={t(
                      "whatsapp.messageTemplate.dynamicUrl.sampleHint",
                    )}
                    label={t("whatsapp.messageTemplate.dynamicUrl.sampleLabel")}
                    name="urlSampleValue"
                    placeholder="abc123"
                  />
                )}
              </>
            )}
            {type === buttonActionTypes.enum.phoneNumber && (
              <InputField
                label={t("fields.phoneNumber.label")}
                name="phone_number"
              />
            )}
            {type === buttonActionTypes.enum.copyCode && (
              <InputField
                description={t("whatsapp.messageTemplate.copyCode.description")}
                label={t("whatsapp.messageTemplate.copyCode.label")}
                name="example"
                placeholder="123456"
              />
            )}
            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                {t("actions.cancel")}
              </Button>
              <Button disabled={!formState.isValid} type="submit">
                {t("actions.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
