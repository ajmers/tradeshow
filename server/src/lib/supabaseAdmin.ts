import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Secret-key client: bypasses RLS and can manage any user's auth record. Only ever
// use this from admin-gated routes — never forward it to a request scoped by a
// particular user's own bearer token.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
