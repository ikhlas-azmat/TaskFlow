import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createGetMyProfileHandler } from './handler.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(createGetMyProfileHandler(async (token) => {
  const { data, error } = await supabase.auth.getUser(token)
  if (error) {
    if ('status' in error && error.status === 401) return null
    throw error
  }
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null
}))
