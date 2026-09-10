import { z } from "zod"

type TranslateFunction = (key: string) => string

// ---------------------------------------------------------------------------
// Static schemas (no user-facing validation messages)
// ---------------------------------------------------------------------------

export const magicLinkRequest = z.object({
  email: z.email(),
})
export type MagicLinkRequest = z.infer<typeof magicLinkRequest>

export const forgotPasswordRequest = z.object({
  email: z.email(),
})
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequest>

// ---------------------------------------------------------------------------
// Schema factories — accept `t()` so validation messages honour the locale.
//
// Each factory returns a Zod schema whose `.refine()` messages and custom
// `.min()` / `.max()` messages come from the i18n translation files under
// `auth.validation.*`.  The component calls `useTranslations()` then passes
// `t` when building the schema for `zodResolver()`.
// ---------------------------------------------------------------------------

export const emailPasswordSignInRequest = z.object({
  email: z.email(),
  password: z.string().min(8),
})
export type EmailPasswordSignInRequest = z.infer<
  typeof emailPasswordSignInRequest
>

export function createEmailPasswordSignUpSchema(t: TranslateFunction) {
  return z
    .object({
      name: z.string().min(1).max(255),
      email: z.email(),
      password: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
      passwordConfirmation: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
    })
    .refine(
      (data) => data.password && data.password === data.passwordConfirmation,
      {
        message: t("auth.validation.passwordsDoNotMatch"),
        path: ["passwordConfirmation"],
      },
    )
}
export type EmailPasswordSignUpRequest = z.infer<
  ReturnType<typeof createEmailPasswordSignUpSchema>
>

export function createResetPasswordSchema(t: TranslateFunction) {
  return z
    .object({
      token: z.string(),
      newPassword: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
      passwordConfirmation: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
    })
    .refine(
      (data) =>
        data.newPassword && data.newPassword === data.passwordConfirmation,
      {
        message: t("auth.validation.passwordsDoNotMatch"),
        path: ["passwordConfirmation"],
      },
    )
}
export type ResetPasswordRequest = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>

export function createChangePasswordSchema(t: TranslateFunction) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
      newPassword: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
      passwordConfirmation: z
        .string()
        .min(8, t("auth.validation.passwordMinLength"))
        .max(100),
    })
    .refine((data) => data.newPassword === data.passwordConfirmation, {
      message: t("auth.validation.passwordsDoNotMatch"),
      path: ["passwordConfirmation"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: t("auth.validation.newPasswordMustDiffer"),
      path: ["newPassword"],
    })
}
export type ChangePasswordRequest = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>

// ---------------------------------------------------------------------------
// Re-export the old constant names for the server action that still needs them.
// The server action (`force-change-password.ts`) uses `changePasswordRequest`
// as an inputSchema — server-side Zod doesn't need translated messages because
// the errors surface through `serverError`, which is already mapped client-side.
// ---------------------------------------------------------------------------
export const resetPasswordRequest = createResetPasswordSchema((k) => {
  const fallbacks: Record<string, string> = {
    "auth.validation.passwordsDoNotMatch": "Passwords do not match",
    "auth.validation.passwordMinLength":
      "Password must be at least 8 characters",
    "auth.validation.newPasswordMustDiffer":
      "New password must be different from your current password",
  }
  return fallbacks[k] ?? k
})

export const changePasswordRequest = createChangePasswordSchema((k) => {
  const fallbacks: Record<string, string> = {
    "auth.validation.passwordsDoNotMatch": "Passwords do not match",
    "auth.validation.passwordMinLength":
      "Password must be at least 8 characters",
    "auth.validation.newPasswordMustDiffer":
      "New password must be different from your current password",
  }
  return fallbacks[k] ?? k
})
