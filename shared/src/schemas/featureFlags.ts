import { z } from 'zod'

export const featureFlagsSchema = z.object({
  boothPlanner3d: z.boolean(),
})

export type FeatureFlags = z.infer<typeof featureFlagsSchema>

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  boothPlanner3d: true,
}
