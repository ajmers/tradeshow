import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

type Mode = 'sign-in' | 'sign-up' | 'sign-up-sent' | 'forgot-password' | 'forgot-password-sent'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function goToMode(nextMode: Mode) {
    setMode(nextMode)
    setError(null)
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) {
      setError(signInError.message)
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (!data.session) {
      // Email confirmation is required — no session yet, so AuthProvider
      // won't pick this account up until the link is clicked.
      setMode('sign-up-sent')
    }
    // If a session did come back (confirmation disabled), AuthProvider's
    // onAuthStateChange listener picks up the SIGNED_IN event on its own and
    // AuthGate takes it from here — showing the awaiting-access screen until
    // an admin assigns this account an Airtable base.
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    // Supabase doesn't reveal whether the email is registered (avoids account
    // enumeration), so this only ever errors on things like rate limiting —
    // the "check your email" message is accurate either way.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setSubmitting(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setMode('forgot-password-sent')
  }

  if (mode === 'sign-up-sent') {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Check your email</h1>
          <p>We&rsquo;ve sent a confirmation link to {email}. Click it to activate your account.</p>
          <button type="button" className="login-form__link" onClick={() => goToMode('sign-in')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'forgot-password-sent') {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Check your email</h1>
          <p>If an account exists for {email}, we&rsquo;ve sent a link to reset your password.</p>
          <button type="button" className="login-form__link" onClick={() => goToMode('sign-in')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'forgot-password') {
    return (
      <div className="login-page">
        <form className="login-form" onSubmit={handleForgotPassword}>
          <h1>Reset your password</h1>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          {error && (
            <p role="alert" className="login-form__error">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          <button type="button" className="login-form__link" onClick={() => goToMode('sign-in')}>
            Back to sign in
          </button>
        </form>
      </div>
    )
  }

  if (mode === 'sign-up') {
    return (
      <div className="login-page">
        <form className="login-form" onSubmit={handleSignUp}>
          <h1>Create your account</h1>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && (
            <p role="alert" className="login-form__error">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <button type="button" className="login-form__link" onClick={() => goToMode('sign-in')}>
            Back to sign in
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSignIn}>
        <h1>Tradeshow</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="login-form__error">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <button type="button" className="login-form__link" onClick={() => goToMode('forgot-password')}>
          Forgot password?
        </button>
        <button type="button" className="login-form__link" onClick={() => goToMode('sign-up')}>
          Don&rsquo;t have an account? Sign up
        </button>
      </form>
    </div>
  )
}
