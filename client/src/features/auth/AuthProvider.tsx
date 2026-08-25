import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { AuthContext } from '@/features/auth/AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // A password-recovery link logs the user into a real session before they've
  // chosen a new password, so this has to be tracked separately from `session`
  // — otherwise AuthGate would drop them straight into the app instead of the
  // "set a new password" form.
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  // Tracks which user's access we last checked, independent of React state, so
  // the onAuthStateChange listener below (registered once, with a closure over
  // the initial render) can tell a real user switch apart from a token refresh
  // without re-checking on every refresh.
  const lastCheckedUserId = useRef<string | null>(null)

  async function checkAccess(userId: string) {
    // A profile row only exists once an admin has assigned this user an
    // Airtable base (see supabase/0001_profiles.sql + Tradeshow.Admin) — its
    // absence means the account exists but isn't provisioned yet.
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
    setHasAccess(data !== null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session) {
        lastCheckedUserId.current = data.session.user.id
        checkAccess(data.session.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      if (event === 'SIGNED_OUT') {
        // Wipe every cached query (items, booths, walls, admin data, ...) so signing
        // in as a different user on the same browser session never shows a flash of
        // the previous user's data before fresh queries resolve.
        queryClient.clear()
        lastCheckedUserId.current = null
        setHasAccess(null)
      }
      if (newSession && newSession.user.id !== lastCheckedUserId.current) {
        lastCheckedUserId.current = newSession.user.id
        setHasAccess(null)
        checkAccess(newSession.user.id)
      }
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        passwordRecovery,
        clearPasswordRecovery: () => setPasswordRecovery(false),
        hasAccess,
        refreshAccess: () => (session ? checkAccess(session.user.id) : Promise.resolve()),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
