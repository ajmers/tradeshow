import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/features/auth/LoginPage'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <p>Loading…</p>
  }

  if (!session) {
    return <LoginPage />
  }

  return <>{children}</>
}
