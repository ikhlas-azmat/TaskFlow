import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { signIn, configurationError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout heading="Welcome back" subtitle="Sign in to pick up where you left off.">
      {configurationError && <p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{configurationError}</p>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block space-y-2 text-sm font-medium">Email address
          <Input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <label className="block space-y-2 text-sm font-medium">Password
          <Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New to TaskFlow? <Link className="font-semibold text-primary hover:underline" to="/register">Create an account</Link></p>
    </AuthLayout>
  )
}
