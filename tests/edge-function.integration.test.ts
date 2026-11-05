import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('deployed get-my-profile Edge Function (live JWT verification)', () => {
  let admin: SupabaseClient
  let accessToken = ''
  let anonKey = ''
  let userId = ''
  let email = ''
  let endpoint = ''

  beforeAll(async () => {
    const url = env.SUPABASE_URL
    anonKey = env.SUPABASE_ANON_KEY ?? ''
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Edge integration tests require SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. See README.md.')
    }

    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    endpoint = `${url.replace(/\/$/, '')}/functions/v1/get-my-profile`
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    email = `taskflow-edge-${suffix}@example.test`
    const password = `TaskFlow-${suffix}-Aa9!`
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (createError) throw createError
    userId = created.user.id

    const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await userClient.auth.signInWithPassword({ email, password })
    if (error) throw error
    accessToken = data.session.access_token
  })

  afterAll(async () => {
    if (admin && userId) await admin.auth.admin.deleteUser(userId)
  })

  it('returns the caller identified by a real authenticated JWT', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: userId, email })
  })

  it('rejects missing and invalid JWTs at the function endpoint', async () => {
    const headers = { apikey: anonKey, 'Content-Type': 'application/json' }
    const missing = await fetch(endpoint, { method: 'POST', headers, body: '{}' })
    expect(missing.status).toBe(401)

    const invalid = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers, Authorization: 'Bearer not-a-real-jwt' },
      body: '{}',
    })
    expect(invalid.status).toBe(401)
  })
})
