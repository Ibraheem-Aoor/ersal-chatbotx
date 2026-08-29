import { edgeSchema } from "@chatbotx.io/flow-config"
import { z } from "zod"

export const importFlowSchema = z.object({
  version: z.number().int().min(1).max(1),
  name: z.string().trim().min(1).max(255),
  active: z.boolean().default(true),
  enableInInbox: z.boolean().default(true),
  nodes: z
    .array(z.object({ id: z.string() }).passthrough())
    .min(1, "Flow must have at least one node"),
  edges: z.array(edgeSchema),
  startNodeId: z.string(),
  folderId: z.string().nullish(),
})
export type ImportFlowSchema = z.infer<typeof importFlowSchema>
