import { z } from 'zod'

export const wallAssignmentFieldsSchema = z.object({
  Assignment: z.string().optional(),
  Wall: z.array(z.string()).optional(),
  Painting: z.array(z.string()).optional(),
  Booth: z.array(z.string()).optional(),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
  // Position of the item's on-wall label, as an offset from the item's own
  // X/Y (not an absolute wall position) — unset until the user first drags
  // the label away from its computed default spot (see defaultLabelOffset in
  // the client's labelPlacement.ts). Storing it relative to the item means
  // moving/transforming the item never needs to touch these fields.
  'Label X Position': z.number().optional(),
  'Label Y Position': z.number().optional(),
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
  // Lets an assignment move to a different wall in the same booth without
  // deleting and recreating the record (which would lose its id/Notes/Order).
  Wall: z.array(z.string()).min(1).optional(),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
  'Label X Position': z.number().optional(),
  'Label Y Position': z.number().optional(),
})

export type WallAssignmentFields = z.infer<typeof wallAssignmentFieldsSchema>
export type WallAssignment = z.infer<typeof wallAssignmentSchema>
export type CreateWallAssignmentInput = z.infer<typeof createWallAssignmentInputSchema>
export type UpdateWallAssignmentInput = z.infer<typeof updateWallAssignmentInputSchema>
