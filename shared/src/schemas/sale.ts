import { z } from 'zod'

export const saleFieldsSchema = z.object({
  'Sale Price': z.number().optional(),
  'Date Sold': z.string().optional(),
  Venue: z.array(z.string()).optional(),
  'Sale Notes': z.string().optional(),
  'Items (Sale History Link)': z.array(z.string()).optional(),
})

export const saleSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: saleFieldsSchema,
})

export const createSaleInputSchema = z.object({
  'Sale Price': z.number().optional(),
  'Date Sold': z.string().optional(),
  Venue: z.array(z.string()).min(1),
  'Sale Notes': z.string().optional(),
  'Items (Sale History Link)': z.array(z.string()).min(1),
})

export type SaleFields = z.infer<typeof saleFieldsSchema>
export type Sale = z.infer<typeof saleSchema>
export type CreateSaleInput = z.infer<typeof createSaleInputSchema>
