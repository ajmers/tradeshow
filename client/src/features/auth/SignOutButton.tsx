import { supabase } from '@/lib/supabase'

export function SignOutButton() {
  return (
    <button type="button" onClick={() => supabase.auth.signOut()}>
      Sign out
    </button>
  )
}
