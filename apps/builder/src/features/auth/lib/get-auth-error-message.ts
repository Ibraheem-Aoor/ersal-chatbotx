/**
 * Maps known better-auth server error messages to i18n translation keys.
 *
 * better-auth returns English error strings regardless of locale. This utility
 * maps those raw messages to `auth.errors.*` translation keys so the UI can
 * display them in the active locale.
 *
 * When an unrecognised error arrives the raw message is returned as-is — this
 * keeps the experience degrading gracefully rather than swallowing unknown
 * errors behind a generic message.
 */

type TranslateFunction = (key: string) => string

/**
 * Map of known better-auth error messages → i18n key suffixes under
 * `auth.errors.*`.  Extend this record when new server-side messages surface.
 */
const AUTH_ERROR_KEY_MAP: Record<string, string> = {
  // Sign-in
  "Invalid email or password": "invalidCredentials",
  "Invalid credentials": "invalidCredentials",

  // Email verification
  "Email not verified": "emailNotVerified",
  "Email is not verified": "emailNotVerified",

  // Token / reset
  "Invalid token": "invalidToken",
  "Token expired": "invalidToken",
  "Token has expired": "invalidToken",

  // Rate limiting
  "Too many requests": "rateLimitExceeded",
  "Too many requests. Please try again later": "rateLimitExceeded",
  "Rate limit exceeded": "rateLimitExceeded",

  // Signup
  "User already exists": "userAlreadyExists",
  "Email already in use": "userAlreadyExists",

  // Password
  "Password is too short": "passwordTooShort",
  "Password is too long": "passwordTooLong",

  // Account
  "User not found": "userNotFound",
  "Account not found": "userNotFound",

  // Change password (server action fallback)
  "Failed to change password": "changePasswordFailed",
}

/**
 * Translate a raw better-auth error object into a localised user-facing string.
 *
 * @param error  The error object returned by `authClient.*` calls.
 *               Expected shape: `{ message: string; status?: number }`.
 * @param t      The `useTranslations()` function (un-namespaced, or scoped to
 *               include `auth.errors.*`).
 * @returns A translated string when the error is recognised, or the raw
 *          `error.message` otherwise.
 */
export function getAuthErrorMessage(
  error: { message?: string; status?: number },
  t: TranslateFunction,
): string {
  const message = error.message ?? ""
  const key = AUTH_ERROR_KEY_MAP[message]
  if (key) {
    return t(`auth.errors.${key}`)
  }
  // Fallback: return the raw message so unknown errors are still visible.
  return message || t("auth.errors.invalidCredentials")
}
