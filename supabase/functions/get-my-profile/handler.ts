export interface VerifiedUser {
  id: string
  email: string | null
}

export type TokenVerifier = (token: string) => Promise<VerifiedUser | null>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function createGetMyProfileHandler(verifyToken: TokenVerifier) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

    const authorization = request.headers.get('Authorization')
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
    if (!match) return jsonResponse({ error: 'A valid Bearer token is required' }, 401)

    try {
      const user = await verifyToken(match[1])
      if (!user) return jsonResponse({ error: 'Invalid or expired token' }, 401)
      return jsonResponse({ id: user.id, email: user.email }, 200)
    } catch (error) {
      const status = typeof error === 'object' && error !== null && 'status' in error && error.status === 401 ? 401 : 502
      return jsonResponse({ error: status === 401 ? 'Invalid or expired token' : 'Unable to verify the token' }, status)
    }
  }
}
