"use server"

import { billingInfoService } from "@chatbotx.io/business"
import { authActionClient } from "@/lib/safe-action"
import { billingInfoSchema } from "../schema/billing-info"

export const saveBillingInfoAction = authActionClient
  .inputSchema(billingInfoSchema)
  .action(
    async ({ parsedInput, ctx }) =>
      await billingInfoService.createOrUpdate({
        userId: ctx.user.id,
        data: {
          companyName: parsedInput.companyName,
          vatNumber: parsedInput.vatNumber || null,
          billingEmail: parsedInput.billingEmail,
          country: parsedInput.country,
          city: parsedInput.city || null,
          address: parsedInput.address || null,
        },
      }),
  )
