"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@chatbotx.io/ui/components/ui/alert"
import { Button, buttonVariants } from "@chatbotx.io/ui/components/ui/button"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { getAuthErrorMessage } from "../lib/get-auth-error-message"
import {
  createEmailPasswordSignUpSchema,
  type EmailPasswordSignUpRequest,
} from "../schemas/action"

export const EmailPasswordSignUp = () => {
  const t = useTranslations()

  const [isSubmitted, setIsSubmitted] = useState(false)

  const schema = useMemo(() => createEmailPasswordSignUpSchema(t), [t])

  const emailPasswordForm = useForm<EmailPasswordSignUpRequest>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    mode: "onChange",
  })

  const onSubmitEmailPasswordForm = async (
    input: EmailPasswordSignUpRequest,
  ) => {
    const { error } = await authClient.signUp.email(input)

    if (error) {
      toast.error(getAuthErrorMessage(error, t))
      return
    }

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>{t("auth.checkYourEmail")}</AlertTitle>
          <AlertDescription>
            {t("auth.signUpCheckEmailDescription")}
          </AlertDescription>
        </Alert>

        <p className="text-center text-muted-foreground text-sm">
          {t("auth.didNotReceiveEmail")}
        </p>

        <Link
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
          href="/auth/sign-in"
        >
          {t("actions.backToSignIn")}
        </Link>
      </div>
    )
  }

  return (
    <Form {...emailPasswordForm}>
      <form
        className="flex w-full flex-col gap-4"
        onSubmit={emailPasswordForm.handleSubmit(onSubmitEmailPasswordForm)}
      >
        <InputField
          label={t("fields.name.label")}
          name="name"
          placeholder={t("fields.name.label")}
          required
        />

        <InputField
          label={t("fields.email.label")}
          name="email"
          placeholder={t("fields.email.label")}
          required
          type="email"
        />

        <InputField
          label={t("fields.password.label")}
          name="password"
          placeholder="********"
          required
          type="password"
        />

        <InputField
          label={t("fields.passwordConfirmation.label")}
          name="passwordConfirmation"
          placeholder="********"
          required
          type="password"
        />

        <Button
          className="w-full"
          disabled={
            !emailPasswordForm.formState.isValid ||
            emailPasswordForm.formState.isSubmitting
          }
          type="submit"
        >
          {emailPasswordForm.formState.isSubmitting && (
            <Loader2Icon className="animate-spin" />
          )}
          {t("actions.continue")}
        </Button>
      </form>
    </Form>
  )
}
