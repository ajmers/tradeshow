import { z } from 'zod'

export const baseInfoSchema = z.object({
  name: z.string().nullable(),
})

export type BaseInfo = z.infer<typeof baseInfoSchema>
