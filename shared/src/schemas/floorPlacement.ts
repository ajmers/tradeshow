import { z } from 'zod'

export const floorPlacementFieldsSchema = z.object({
  Placement: z.string().optional(),
  Item: z.array(z.string()).optional(),
  Booth: z.array(z.string()).optional(),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
})

export const floorPlacementSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: floorPlacementFieldsSchema,
})

export const createFloorPlacementInputSchema = floorPlacementFieldsSchema.extend({
  Item: z.array(z.string()).min(1, 'An item is required'),
  Booth: z.array(z.string()).min(1, 'A booth is required'),
})

export const updateFloorPlacementInputSchema = floorPlacementFieldsSchema.partial()

export type FloorPlacementFields = z.infer<typeof floorPlacementFieldsSchema>
export type FloorPlacement = z.infer<typeof floorPlacementSchema>
export type CreateFloorPlacementInput = z.infer<typeof createFloorPlacementInputSchema>
export type UpdateFloorPlacementInput = z.infer<typeof updateFloorPlacementInputSchema>
