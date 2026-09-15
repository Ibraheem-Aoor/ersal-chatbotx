"use server"

import { ChatbotXException } from "@chatbotx.io/business/errors"
import { db, isDatabaseError } from "@chatbotx.io/database/client"
import { customFieldModel } from "@chatbotx.io/database/schema"
import { getTranslations } from "next-intl/server"
import { returnValidationErrors } from "next-safe-action"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { ensureFolderIsExists } from "@/features/folders/actions/utils"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type CreateCustomFieldRequest,
  createCustomFieldRequest,
} from "../schemas/action"
import type { CustomFieldResource } from "../schemas/resource"

export const createCustomFieldAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(createCustomFieldRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: CreateCustomFieldRequest
    }) => {
      await createCustomField(workspaceId, parsedInput)
    },
  )

export const createCustomField = async (
  workspaceId: string,
  parsedInput: CreateCustomFieldRequest,
): Promise<CustomFieldResource> => {
  if (parsedInput.folderId) {
    await ensureFolderIsExists(parsedInput.folderId, workspaceId, "customField")
  }

  try {
    const newField = await db
      .insert(customFieldModel)
      .values({
        workspaceId,
        showInInbox: true,
        ...parsedInput,
      })
      .returning()
      .then((result) => result[0])

    return newField
  } catch (error) {
    if (isDatabaseError(error) && error.cause.code === "23505") {
      const t = await getTranslations("validation")
      return returnValidationErrors(createCustomFieldRequest, {
        _errors: [t("validationException")],
        name: { _errors: [t("nameAlreadyTaken")] },
      })
    }

    throw new ChatbotXException("Failed to create custom field")
  }
}
