import { z } from 'zod'

export const wallFieldsSchema = z.object({
  'Wall Name': z.string().optional(),
  Height: z.number().optional(),
  Width: z.number().optional(),
  'Unit of Measure': z.enum(['inches', 'centimeters', 'cm']).optional(),
  'Wall Color': z.string().optional(),
  Description: z.string().optional(),
  Location: z.string().optional(),
  Booths: z.array(z.string()).optional(),
})

export const wallSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: wallFieldsSchema,
})

export const createWallInputSchema = wallFieldsSchema.extend({
  'Wall Name': z.string().min(1, 'Wall Name is required'),
  Booths: z.array(z.string()).min(1, 'A wall must belong to a booth'),
})

export const updateWallInputSchema = wallFieldsSchema.partial()

export type WallFields = z.infer<typeof wallFieldsSchema>
export type Wall = z.infer<typeof wallSchema>
export type CreateWallInput = z.infer<typeof createWallInputSchema>
export type UpdateWallInput = z.infer<typeof updateWallInputSchema>
