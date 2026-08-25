import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  loading: boolean
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
