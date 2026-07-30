import { z } from 'zod'
import { airtableAttachmentSchema } from './airtable'

export const itemFieldsSchema = z.object({
  Title: z.string().optional(),
  Artist: z.string().optional(),
  Description: z.string().optional(),
  Images: z.array(airtableAttachmentSchema).optional(),
  'cropped image': z.array(airtableAttachmentSchema).optional(),
  Height: z.number().optional(),
  Width: z.number().optional(),
  Depth: z.number().optional(),
  'Unit of Measure': z.enum(['inches', 'centimeters']).optional(),
  'Framing Details': z.string().optional(),
  'Date Acquired': z.string().optional(),
  Location: z.string().optional(),
  Condition: z.enum(['Excellent', 'Good', 'Fair', 'Needs Restoration']).optional(),
  Tags: z.array(z.string()).optional(),
  Consigner: z.string().optional(),
  'List Price': z.number().optional(),
  Discount: z.number().optional(),
  Label: z.string().optional(),
  'Label Title': z.string().optional(),
})

export const itemSchema = z.object({
  id: z.string(),
  createdTime: z.string().optional(),
  fields: itemFieldsSchema,
})

export const createItemInputSchema = itemFieldsSchema
  .omit({ Images: true, 'cropped image': true })
  .extend({ Title: z.string().min(1, 'Title is required') })

export const updateItemInputSchema = createItemInputSchema.partial()

export const uploadItemPhotoInputSchema = z.object({
  field: z.enum(['Images', 'cropped image']),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  file: z.string().min(1),
})

export type ItemFields = z.infer<typeof itemFieldsSchema>
export type Item = z.infer<typeof itemSchema>
export type CreateItemInput = z.infer<typeof createItemInputSchema>
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>
export type UploadItemPhotoInput = z.infer<typeof uploadItemPhotoInputSchema>
