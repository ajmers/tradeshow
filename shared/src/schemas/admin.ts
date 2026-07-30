import { z } from 'zod'
import { featureFlagsSchema } from './featureFlags'

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  airtableBaseId: z.string().nullable(),
  isAdmin: z.boolean(),
  featureFlags: featureFlagsSchema,
})

export type AdminUser = z.infer<typeof adminUserSchema>

export const updateUserBaseInputSchema = z.object({
  airtableBaseId: z.string().min(1),
})

export type UpdateUserBaseInput = z.infer<typeof updateUserBaseInputSchema>

export const updateUserFeatureFlagsInputSchema = z.object({
  featureFlags: featureFlagsSchema.partial(),
})

export type UpdateUserFeatureFlagsInput = z.infer<typeof updateUserFeatureFlagsInputSchema>

export const airtableBaseSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionLevel: z.string(),
})

export type AirtableBaseSummary = z.infer<typeof airtableBaseSummarySchema>
