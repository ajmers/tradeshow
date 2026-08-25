import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function AwaitingAccessPage() {
  const { session, refreshAccess } = useAuth()
  const [checking, setChecking] = useState(false)

  async function handleCheckAgain() {
    setChecking(true)
    await refreshAccess()
    setChecking(false)
  }

  return (
    <div className="login-page">
      <div className="login-form">
        <h1>Almost there</h1>
        <p>
          Your account ({session?.user.email}) is set up, but an admin still needs to grant you
          access before you can get in.
        </p>
        <button type="button" onClick={handleCheckAgain} disabled={checking}>
          {checking ? 'Checking…' : "I've been granted access"}
        </button>
        <button
          type="button"
          className="login-form__link"
          onClick={() => {
            supabase.auth.signOut()
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
