import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, passwordRecovery } = useAuth()

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

  return <>{children}</>
}
