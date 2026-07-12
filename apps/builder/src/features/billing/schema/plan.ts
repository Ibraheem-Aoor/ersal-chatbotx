import { z } from "zod"

export const planLimitsSchema = z.object({
  contacts: z.coerce.number().int().min(0),
  mac: z.coerce.number().int().min(0),
  workspaces: z.coerce.number().int().min(0),
  channels: z.coerce.number().int().min(0),
  teamMembers: z.coerce.number().int().min(0),
  flows: z.coerce.number().int().min(0),
  broadcasts: z.coerce.number().int().min(0),
  aiAgents: z.boolean(),
  removeBranding: z.boolean(),
})

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  limits: planLimitsSchema,
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})

export const updatePlanSchema = createPlanSchema.partial()

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
