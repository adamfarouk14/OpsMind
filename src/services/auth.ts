import { supabase } from '../lib/supabase'
import { ROLE_NAMES } from '../lib/permissions'
import type { UserRole } from '../types/database'

export interface TokenSession {
  access_token: string
  refresh_token: string
}

// Edge Functions answer with { error, code }. The code decides the user-facing
// message (throttled vs. generic credential failure), so it must survive.
export class FunctionError extends Error {
  code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'FunctionError'
    this.code = code
  }
}

// supabase-js throws on a non-2xx function response, so the JSON body the
// endpoint wrote (its { error, code } pair) is only reachable through the
// Response hanging off the error. Reading it keeps the codes intact.
export async function readFunctionError(error: unknown, data: unknown): Promise<FunctionError> {
  const payload = data as { error?: string; code?: string } | null
  if (payload?.error) return new FunctionError(payload.error, payload.code)

  const httpError = error as (Error & { context?: Response }) | null
  const context = httpError?.context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json() as { error?: string; code?: string }
      if (body?.error) return new FunctionError(body.error, body.code)
    } catch {
      // Body was not JSON >>> fall back to the transport message below.
    }
  }

  return new FunctionError(httpError?.message ?? 'Request failed')
}

// The endpoint resolves username -> email on the server, so the browser
// never learns an address it did not already own.
export async function signInWithUsername(username: string, password: string): Promise<TokenSession> {
  const { data, error } = await supabase.functions.invoke('sign-in-with-username', {
    body: { username, password },
  })

  if (error || !data?.access_token || !data?.refresh_token) {
    throw await readFunctionError(error, data)
  }

  return { access_token: data.access_token, refresh_token: data.refresh_token }
}

// Admin-created account. Still the only path that can grant Manager or Admin.
export async function createManagedUser(input: {
  email: string
  username: string
  password: string
  name: string
  role: UserRole
  department?: string
}) {
  if (!ROLE_NAMES.includes(input.role)) throw new Error('Unsupported role')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You must be signed in as an administrator to create users.')

  const { data, error } = await supabase.functions.invoke('create-user', { body: input })

  if (error || !data?.success) {
    throw await readFunctionError(error, data)
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
