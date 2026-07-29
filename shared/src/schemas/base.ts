import { z } from 'zod'

export const baseInfoSchema = z.object({
  name: z.string().nullable(),
  isAdmin: z.boolean(),
})

export type BaseInfo = z.infer<typeof baseInfoSchema>
