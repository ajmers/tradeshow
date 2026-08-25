import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { AwaitingAccessPage } from '@/features/auth/AwaitingAccessPage'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, passwordRecovery, hasAccess } = useAuth()

  if (loading) {
    return <p>Loading…</p>
  }

  // Checked ahead of the session check — a recovery link signs the user into a
  // real session, so without this they'd land straight in the app instead of
  // being asked to set a new password.
  if (passwordRecovery) {
    return <ResetPasswordPage />
  }

  if (!session) {
    return <LoginPage />
  }

  // A signed-up user has no profile row until an admin assigns them an
  // Airtable base — without this they'd fall through to a broken app (nav
  // with no base name, pages stuck on failed fetches) instead of a clear
  // "waiting for access" state.
  if (hasAccess === null) {
    return <p>Loading…</p>
  }

  if (!hasAccess) {
    return <AwaitingAccessPage />
  }

  return <>{children}</>
}
