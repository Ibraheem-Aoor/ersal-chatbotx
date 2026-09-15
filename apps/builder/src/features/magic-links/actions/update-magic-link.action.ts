"use server"

import {
  and,
  db,
  eq,
  findOrFail,
  isUniqueViolationError,
} from "@chatbotx.io/database/client"
import { magicLinkModel } from "@chatbotx.io/database/schema"
import { zodBigintAsString } from "@chatbotx.io/utils"
import { getTranslations } from "next-intl/server"
import { returnValidationErrors } from "next-safe-action"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type UpdateMagicLinkRequest,
  updateMagicLinkRequest,
} from "../schemas/action"

export const updateMagicLinkAction = workspaceActionClient
  .bindArgsSchemas([zodBigintAsString(), zodBigintAsString()])
  .inputSchema(updateMagicLinkRequest)
  .action(async (props) => {
    const {
      bindArgsParsedInputs: [workspaceId, id],
      parsedInput,
    } = props

    return await updateMagicLink(
      {
        workspaceId,
        id,
      },
      parsedInput,
    )
  })

export const updateMagicLink = async (
  ctx: {
    workspaceId: string
    id: string
  },
  parsedInput: UpdateMagicLinkRequest,
) => {
  const link = await findOrFail({
    table: magicLinkModel,
    where: {
      id: ctx.id,
      workspaceId: ctx.workspaceId,
    },
    message: "Magic link not found",
  })
  try {
    await db
      .update(magicLinkModel)
      .set(parsedInput)
      .where(and(eq(magicLinkModel.id, link.id)))
  } catch (error) {
    if (isUniqueViolationError(error)) {
      const t = await getTranslations("validation")
      return returnValidationErrors(updateMagicLinkRequest, {
        _errors: [t("validationException")],
        name: { _errors: [t("nameAlreadyTaken")] },
      })
    }

    throw error
  }
}
