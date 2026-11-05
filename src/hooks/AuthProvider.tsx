import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthContextValue } from '@/hooks/authContext'
import { isSupabaseConfigured, requireSupabase } from '@/lib/supabase'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const client = requireSupabase()
    let active = true
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    loading,
    configurationError: authError ?? (!isSupabaseConfigured ? 'Add your Supabase URL and publishable/anon key to .env.local to get started.' : null),
    async signIn(email, password) {
      const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
      if (error) throw new Error(getErrorMessage(error))
    },
    async signUp(email, password) {
      const { error } = await requireSupabase().auth.signUp({ email, password })
      if (error) throw new Error(getErrorMessage(error))
    },
    async signOut() {
      const { error } = await requireSupabase().auth.signOut()
      if (error) throw new Error(getErrorMessage(error))
    },
  }), [session, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
