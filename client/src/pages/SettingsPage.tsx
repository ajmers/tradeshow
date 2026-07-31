import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPassword('')
    setConfirmPassword('')
    setSuccess(true)
  }

  return (
    <main>
      <h1>Settings</h1>
      <section className="settings-section">
        <h2>Password</h2>
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setSuccess(false)
              }}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setSuccess(false)
              }}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && (
            <p role="alert" className="settings-form__error">
              {error}
            </p>
          )}
          {success && <p className="settings-form__success">Password updated.</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  )
}
