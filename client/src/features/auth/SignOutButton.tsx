import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function SignOutButton() {
  const navigate = useNavigate()

  async function handleSignOut() {
    // Navigate first, while the router is still mounted — otherwise the next
    // user to sign in on this tab lands back on whatever booth/wall URL this
    // session left behind, which almost certainly isn't theirs.
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  return (
    <button type="button" onClick={handleSignOut}>
      Sign out
    </button>
  )
}
