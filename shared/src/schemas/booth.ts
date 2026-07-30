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
  'Wall Assignments': z.array(z.string()).optional(),
  Sales: z.array(z.string()).optional(),
  'Booth Width': z.number().optional(),
  'Booth Depth': z.number().optional(),
  'Booth Height': z.number().optional(),
})

export const boothSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: boothFieldsSchema,
})

export const createBoothInputSchema = boothFieldsSchema
  .omit({ Walls: true })
  .extend({ 'Booth Name': z.string().min(1, 'Booth Name is required') })

export const updateBoothInputSchema = boothFieldsSchema.omit({ Walls: true }).partial()

export type BoothFields = z.infer<typeof boothFieldsSchema>
export type Booth = z.infer<typeof boothSchema>
export type CreateBoothInput = z.infer<typeof createBoothInputSchema>
export type UpdateBoothInput = z.infer<typeof updateBoothInputSchema>
