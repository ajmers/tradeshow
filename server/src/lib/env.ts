import { z } from 'zod'

try {
  process.loadEnvFile()
} catch {
  // no .env file present; rely on real environment variables (e.g. in production)
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AIRTABLE_PAT: z.string().min(1, 'AIRTABLE_PAT is required'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'SUPABASE_PUBLISHABLE_KEY is required'),
})

export const env = envSchema.parse(process.env)
