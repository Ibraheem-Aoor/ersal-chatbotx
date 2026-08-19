import { z } from "zod"

export const billingInfoSchema = z.object({
  companyName: z.string().min(1),
  vatNumber: z.string().optional().or(z.literal("")),
  billingEmail: z.string().email(),
  country: z.string().default("SA"),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

export type BillingInfoInput = z.infer<typeof billingInfoSchema>
