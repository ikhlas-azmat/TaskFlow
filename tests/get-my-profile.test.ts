import { describe, expect, it, vi } from 'vitest'
import { createGetMyProfileHandler } from '../supabase/functions/get-my-profile/handler'

describe('get-my-profile handler (unit tests with an injected verifier)', () => {
  it('returns the identity resolved by the token verifier', async () => {
    const verifyToken = vi.fn().mockResolvedValue({ id: 'user-123', email: 'person@example.com' })
    const handler = createGetMyProfileHandler(verifyToken)
    const response = await handler(new Request('https://function.example.test', {
      method: 'POST', headers: { Authorization: 'Bearer signed-jwt' }, body: JSON.stringify({ id: 'spoofed-user' }),
    }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'user-123', email: 'person@example.com' })
    expect(verifyToken).toHaveBeenCalledWith('signed-jwt')
  })

  it('rejects a missing or malformed Authorization header', async () => {
    const verifyToken = vi.fn()
    const handler = createGetMyProfileHandler(verifyToken)
    for (const authorization of [null, 'Basic token', 'Bearer']) {
      const headers = new Headers()
      if (authorization) headers.set('Authorization', authorization)
      const response = await handler(new Request('https://function.example.test', { method: 'POST', headers }))
      expect(response.status).toBe(401)
    }
    expect(verifyToken).not.toHaveBeenCalled()
  })

  it('rejects invalid and expired tokens when the verifier cannot resolve a user', async () => {
    const handler = createGetMyProfileHandler(vi.fn().mockResolvedValue(null))
    for (const token of ['invalid-token', 'expired-token']) {
      const response = await handler(new Request('https://function.example.test', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      }))
      expect(response.status).toBe(401)
    }
  })

  it('handles CORS preflight and unsupported methods', async () => {
    const handler = createGetMyProfileHandler(vi.fn())
    expect((await handler(new Request('https://function.example.test', { method: 'OPTIONS' }))).status).toBe(200)
    expect((await handler(new Request('https://function.example.test', { method: 'GET' }))).status).toBe(405)
  })
})
