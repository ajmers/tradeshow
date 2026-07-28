import { z } from 'zod'

export const boothFieldsSchema = z.object({
  'Booth Name': z.string().optional(),
  'Event Start Date': z.string().optional(),
  'Event End Date': z.string().optional(),
  'Booth Type': z.enum(['Solo', 'Group', 'Gallery', 'Fair', 'Pop-Up', 'Other']).optional(),
  'Event Location': z.string().optional(),
  Organizer: z.string().optional(),
  Notes: z.string().optional(),
  Walls: z.array(z.string()).optional(),
})

export const boothSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: boothFieldsSchema,
})

export type BoothFields = z.infer<typeof boothFieldsSchema>
export type Booth = z.infer<typeof boothSchema>
