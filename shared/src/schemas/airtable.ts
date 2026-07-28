import { z } from 'zod'

const airtableThumbnailSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
})

export const airtableAttachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  size: z.number().optional(),
  type: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnails: z
    .object({
      small: airtableThumbnailSchema.optional(),
      large: airtableThumbnailSchema.optional(),
      full: airtableThumbnailSchema.optional(),
    })
    .optional(),
})

export type AirtableAttachment = z.infer<typeof airtableAttachmentSchema>
