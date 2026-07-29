import { z } from 'zod'

export const consignerFieldsSchema = z.object({
  Name: z.string().optional(),
  // Airtable percent field: 20% is returned as 0.2, not 20.
  'Consignment rate': z.number().optional(),
})

export const consignerSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: consignerFieldsSchema,
})

export type ConsignerFields = z.infer<typeof consignerFieldsSchema>
export type Consigner = z.infer<typeof consignerSchema>
