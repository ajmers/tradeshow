import { z } from 'zod'

export const wallAssignmentFieldsSchema = z.object({
  Assignment: z.string().optional(),
  Wall: z.array(z.string()).optional(),
  Painting: z.array(z.string()).optional(),
  Booth: z.array(z.string()).optional(),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
  Notes: z.string().optional(),
  Order: z.number().optional(),
})

export const wallAssignmentSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: wallAssignmentFieldsSchema,
})

export const createWallAssignmentInputSchema = z.object({
  Assignment: z.string().optional(),
  Wall: z.array(z.string()).min(1),
  Painting: z.array(z.string()).min(1),
  Booth: z.array(z.string()).min(1),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
})

export const updateWallAssignmentInputSchema = z.object({
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
})

export type WallAssignmentFields = z.infer<typeof wallAssignmentFieldsSchema>
export type WallAssignment = z.infer<typeof wallAssignmentSchema>
export type CreateWallAssignmentInput = z.infer<typeof createWallAssignmentInputSchema>
export type UpdateWallAssignmentInput = z.infer<typeof updateWallAssignmentInputSchema>
