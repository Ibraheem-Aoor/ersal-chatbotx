"use server"

import { db, isUniqueViolationError } from "@chatbotx.io/database/client"
import { magicLinkModel } from "@chatbotx.io/database/schema"
import { createId } from "@chatbotx.io/utils"
import { returnValidationErrors } from "next-safe-action"
import { getTranslations } from "next-intl/server"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type CreateMagicLinkRequest,
  createMagicLinkRequest,
} from "../schemas/action"

export const createMagicLinkAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(createMagicLinkRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: CreateMagicLinkRequest
    }) => {
      try {
        await db.insert(magicLinkModel).values({
          id: createId(),
          workspaceId,
          ...parsedInput,
        })
      } catch (error) {
        if (isUniqueViolationError(error)) {
          const t = await getTranslations("validation")
          return returnValidationErrors(createMagicLinkRequest, {
            _errors: [t("validationException")],
            name: { _errors: [t("nameAlreadyTaken")] },
          })
        }

        throw error
      }
    },
  )
