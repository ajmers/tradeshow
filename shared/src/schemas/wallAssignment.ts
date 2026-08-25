import { z } from 'zod'

export const wallAssignmentFieldsSchema = z.object({
  Assignment: z.string().optional(),
  Wall: z.array(z.string()).optional(),
  Painting: z.array(z.string()).optional(),
  Booth: z.array(z.string()).optional(),
  'X Position': z.number().optional(),
  'Y Position': z.number().optional(),
  'Rotation Angle': z.number().optional(),
  // Position of the item's on-wall label, independent of the item's own X/Y —
  // unset until the user first drags the label away from its computed default
  // spot (see defaultLabelPosition in the client's labelPlacement.ts).
  'Label X Position': z.number().optional(),
  'Label Y Position': z.number().optional(),
  // Per-item overrides on top of the wall's "Show Labels" default (see
  // wall.ts) — Label Hidden always wins if both are somehow set. Airtable
  // checkboxes are only ever present-and-true when checked, absent when not,
  // so "unset" on either field means "just follow the wall's default."
  'Label Hidden': z.boolean().optional(),
  'Label Shown': z.boolean().optional(),
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
  'Label Hidden': z.boolean().optional(),
  'Label Shown': z.boolean().optional(),
})

export type WallAssignmentFields = z.infer<typeof wallAssignmentFieldsSchema>
export type WallAssignment = z.infer<typeof wallAssignmentSchema>
export type CreateWallAssignmentInput = z.infer<typeof createWallAssignmentInputSchema>
export type UpdateWallAssignmentInput = z.infer<typeof updateWallAssignmentInputSchema>
