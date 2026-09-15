"use server"

import { db, isUniqueViolationError } from "@chatbotx.io/database/client"
import { reflinkModel } from "@chatbotx.io/database/schema"
import { createId } from "@chatbotx.io/utils"
import { getTranslations } from "next-intl/server"
import { returnValidationErrors } from "next-safe-action"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schemas"
import { workspaceActionClient } from "@/lib/safe-action"
import {
  type CreateReflinkRequest,
  createReflinkRequest,
} from "../schemas/action"

export const createReflinkAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(createReflinkRequest)
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: CreateReflinkRequest
    }) => {
      try {
        await db.insert(reflinkModel).values({
          id: createId(),
          workspaceId,
          type: "refLink",
          ...parsedInput,
        })
      } catch (error) {
        if (isUniqueViolationError(error)) {
          const t = await getTranslations("validation")
          return returnValidationErrors(createReflinkRequest, {
            _errors: [t("validationException")],
            name: { _errors: [t("nameAlreadyTaken")] },
          })
        }

        throw error
      }
    },
  )
