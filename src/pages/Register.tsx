import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export function Register() {
  const { signUp, configurationError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await signUp(email, password)
      setSuccess('Account created. If email confirmation is enabled, check your inbox before signing in.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout heading="Create your account" subtitle="Start organizing your work in minutes.">
      {configurationError && <p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{configurationError}</p>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block space-y-2 text-sm font-medium">Email address
          <Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Password
          <Input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Confirm password
          <Input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Type your password again" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
        <Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link className="font-semibold text-primary hover:underline" to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
