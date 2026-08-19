import {
  ChannelError,
  ChannelErrorCategory,
  UNKNOWN_ERROR,
} from "@chatbotx.io/sdk"
import ky, { HTTPError } from "ky"
import type { WhatsappAuthValue } from ".."
import { API_URL, DEFAULT_API_VERSION } from "../constants"
import { rescue, WhatsappException } from "../exception"
import { mapToChannelError } from "../lib/error-mapper"
import { logger } from "../lib/logger"
import { listPhoneNumbers } from "./phone-number"

const api = ky.create({
  timeout: 60_000,
})

interface WhatsappSettings {
  businessId?: string
  businessName: string
  systemUserId: string
  systemUserToken: string
}

// FORK PATCH: attempt-and-skip pattern for non-BSP self-hosted deployments.
// The call is always attempted; if it fails AND the skip flag is set, the
// error is logged and swallowed so the connect flow can continue.
export async function addSystemUser({
  auth,
  whatsappSettings,
}: {
  auth: WhatsappAuthValue
  whatsappSettings: WhatsappSettings
}) {
  const skipAssignment = process.env.SKIP_WABA_USER_ASSIGNMENT === "true"
  const { version = DEFAULT_API_VERSION } = auth

  try {
    await rescue(async () => {
      await api.post(
        `${API_URL}/${version}/${auth.metadata.wabaId}/assigned_users`,
        {
          searchParams: {
            user: whatsappSettings.systemUserId,
            tasks: "MANAGE",
          },
          headers: {
            Authorization: `Bearer ${whatsappSettings.systemUserToken}`,
          },
        },
      )
    })
  } catch (err) {
    if (skipAssignment) {
      logger.warn(
        { err, wabaId: auth.metadata.wabaId },
        "WABA system user assignment failed -- skipped (SKIP_WABA_USER_ASSIGNMENT=true)",
      )
      return
    }
    throw err
  }
}

// FORK PATCH: attempt-and-skip + specific Facebook error subcode handling.
export async function shareCreditLine({
  auth,
  whatsappSettings,
}: {
  auth: WhatsappAuthValue
  whatsappSettings: WhatsappSettings
}) {
  const skipCreditSharing = process.env.SKIP_WABA_CREDIT_SHARING === "true"
  const { version = DEFAULT_API_VERSION } = auth

  try {
    await rescue(async () => {
      const creditLineId = await retrieveCreditLineId(whatsappSettings)

      try {
        await api.post(
          `${API_URL}/${version}/${creditLineId}/whatsapp_credit_sharing_and_attach`,
          {
            searchParams: {
              waba_id: auth.metadata.wabaId,
              waba_currency: "USD",
            },
            headers: {
              Authorization: `Bearer ${whatsappSettings.systemUserToken}`,
            },
          },
        )
      } catch (error) {
        if (error instanceof HTTPError) {
          const body: Record<string, unknown> = await error.response
            .json()
            .catch(() => ({}))
          const subCode = (
            body as { error?: { error_subcode?: number } }
          )?.error?.error_subcode
          // Same business owns both WABA and credit line — not an error
          if (subCode === 1_752_244) {
            logger.info(
              { wabaId: auth.metadata.wabaId },
              "Credit line already shared (same business)",
            )
            return
          }
          // Violates Facebook invoicing policy — non-fatal for non-BSP
          if (subCode === 1_752_294) {
            logger.warn(
              { wabaId: auth.metadata.wabaId },
              "Credit line sharing blocked by invoicing policy",
            )
            return
          }
        }
        throw error
      }
    })
  } catch (err) {
    if (skipCreditSharing) {
      logger.warn(
        { err, wabaId: auth.metadata.wabaId },
        "WABA credit line sharing failed -- skipped (SKIP_WABA_CREDIT_SHARING=true)",
      )
      return
    }
    throw err
  }
}

function retrieveCreditLineId(
  whatsappSettings: WhatsappSettings,
): Promise<string> {
  return rescue(async () => {
    const response = await api
      .get(
        `${API_URL}/${DEFAULT_API_VERSION}/${whatsappSettings.businessId}/extendedcredits`,
        {
          searchParams: {
            fields: "id,legal_entity_name",
          },
          headers: {
            Authorization: `Bearer ${whatsappSettings.systemUserToken}`,
          },
        },
      )
      .json<{ data: Array<{ id: string; legal_entity_name: string }> }>()

    const creditLine = response.data.find((line) =>
      line.legal_entity_name.includes(whatsappSettings.businessName),
    )

    if (!creditLine) {
      throw new WhatsappException("You need to set up a line of credit")
    }

    return creditLine.id
  })
}

export type RegisterPhoneNumberResult =
  | { status: "registered" }
  | { status: "verification_required"; error: ChannelError }
  | { status: "failed"; error: ChannelError }

const PHONE_VERIFICATION_REQUIRED_CODE = 133_006
const PHONE_NOT_VERIFIED_SUBCODE = 2_593_005

const isVerificationRequiredError = (error: ChannelError): boolean =>
  Number(error.code) === PHONE_VERIFICATION_REQUIRED_CODE ||
  Number(error.subCode) === PHONE_NOT_VERIFIED_SUBCODE

const createPhoneNumberNotFoundError = (phoneNumberId: string) => {
  const error = new ChannelError(
    "WhatsApp phone number was not found in the selected WhatsApp Business Account.",
    ChannelErrorCategory.PERMISSION_DENIED,
    {
      code: UNKNOWN_ERROR.code,
      httpStatusCode: 404,
      subCode: null,
      type: "PhoneNumberNotFound",
    },
  )
  error.setOriginError({ phoneNumberId })
  return error
}

const createVerificationRequiredError = (phoneNumberId: string) => {
  const error = new ChannelError(
    "WhatsApp phone number verification is required before registration.",
    ChannelErrorCategory.PERMISSION_DENIED,
    {
      code: PHONE_VERIFICATION_REQUIRED_CODE,
      httpStatusCode: 403,
      subCode: null,
      type: "PhoneVerificationRequired",
    },
  )
  error.setOriginError({ phoneNumberId })
  return error
}

// FORK PATCH: attempt-and-skip pattern for non-BSP self-hosted deployments.
export async function registerPhoneNumber({
  auth,
  phoneNumberId,
}: {
  auth: WhatsappAuthValue
  phoneNumberId: string
}): Promise<RegisterPhoneNumberResult> {
  const skipRegistration = process.env.SKIP_WABA_PHONE_REGISTRATION === "true"
  const { version = DEFAULT_API_VERSION } = auth

  try {
    return await rescue(async () => {
      const phoneNumbers = await listPhoneNumbers({
        wabaId: auth.metadata.wabaId,
        accessToken: auth.tokens.accessToken,
        version,
      })
      const phoneNumber = phoneNumbers.data.find(
        (candidate) => candidate.id === phoneNumberId,
      )

      if (!phoneNumber) {
        return {
          status: "failed" as const,
          error: createPhoneNumberNotFoundError(phoneNumberId),
        }
      }

      if (phoneNumber.code_verification_status !== "VERIFIED") {
        return {
          status: "verification_required" as const,
          error: createVerificationRequiredError(phoneNumberId),
        }
      }

      try {
        const registrationPin = generatePin(
          phoneNumber.id,
          auth.metadata.wabaId,
        )

        await api.post(`${API_URL}/${version}/${phoneNumber.id}/register`, {
          json: {
            messaging_product: "whatsapp",
            pin: registrationPin,
          },
          headers: {
            Authorization: `Bearer ${auth.tokens.accessToken}`,
          },
        })
        return { status: "registered" as const }
      } catch (error) {
        const channelError = mapToChannelError(error)
        if (isVerificationRequiredError(channelError)) {
          return { status: "verification_required" as const, error: channelError }
        }

        return { status: "failed" as const, error: channelError }
      }
    })
  } catch (err) {
    if (skipRegistration) {
      logger.warn(
        { err, wabaId: auth.metadata.wabaId },
        "WABA phone registration failed -- skipped (SKIP_WABA_PHONE_REGISTRATION=true)",
      )
      return { status: "registered" }
    }
    throw err
  }
}

function generatePin(phoneNumberId: string, wabaId: string): string {
  const sum = BigInt(phoneNumberId) + BigInt(wabaId)
  const pin = sum.toString().slice(-6)
  return pin
}
