import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  loading: boolean
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
  // null while unknown/checking, so AuthGate can tell "still checking" apart
  // from "checked, and there isn't one yet" (a signed-up user an admin hasn't
  // assigned an Airtable base to).
  hasAccess: boolean | null
  refreshAccess: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
