import { z } from 'zod'
import { featureFlagsSchema } from './featureFlags'

export const baseInfoSchema = z.object({
  name: z.string().nullable(),
  isAdmin: z.boolean(),
  featureFlags: featureFlagsSchema,
})

export type BaseInfo = z.infer<typeof baseInfoSchema>
