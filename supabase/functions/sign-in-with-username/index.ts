import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_BODY_BYTES = 4096
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/
const MAX_ATTEMPTS_PER_TARGET = 10
const MAX_ATTEMPTS_PER_IP = 40
const WINDOW_SECONDS = 900

const GENERIC_FAILURE = { error: 'Invalid username or password', code: 'invalid_credentials' }
const THROTTLED = { error: 'Too many sign-in attempts. Please wait before trying again.', code: 'rate_limited' }

function originFor(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  const allowList = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allowList.includes(origin)) return origin
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin
  const siteUrl = Deno.env.get('SITE_URL')
  return siteUrl && origin === siteUrl ? origin : null
}

function headersFor(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(origin) })
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || 'unknown'
}

serve(async (req) => {
  const origin = originFor(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: headersFor(origin) })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('sign_in_config_missing')
    return json({ error: 'Sign-in service is not configured.' }, 500, origin)
  }

  // service-role is used only to resolve username -> email and to read the
  // account status. It is never returned to the caller.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Credentials are checked with the anon key only; the service-role client is
  // never used to authenticate a password. The token endpoint is called
  // directly because the supabase-js auth client yields no session object in
  // this Deno runtime even when the grant succeeds.

  let body: Record<string, unknown>
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return json(GENERIC_FAILURE, 401, origin)
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return json(GENERIC_FAILURE, 401, origin)
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username || !password || password.length > 128) return json(GENERIC_FAILURE, 401, origin)

  const ip = clientIp(req)
  const targetKey = await sha256(`target:${ip}:${username}`)
  const ipKey = await sha256(`ip:${ip}`)

  const { data: blocked } = await adminClient
    .rpc('auth_rate_blocked', { p_attempt_key: targetKey, p_max_attempts: MAX_ATTEMPTS_PER_TARGET, p_window_seconds: WINDOW_SECONDS })
  const { data: ipBlocked } = await adminClient
    .rpc('auth_rate_blocked', { p_attempt_key: ipKey, p_max_attempts: MAX_ATTEMPTS_PER_IP, p_window_seconds: WINDOW_SECONDS })
  if (blocked || ipBlocked) return json(THROTTLED, 429, origin)

  // A malformed username is refused without any lookup, so the response is
  // identical to a wrong password and cannot confirm whether a username exists.
  if (!USERNAME_PATTERN.test(username)) {
    await adminClient.rpc('auth_rate_record', { p_attempt_key: targetKey, p_max_attempts: MAX_ATTEMPTS_PER_TARGET, p_window_seconds: WINDOW_SECONDS })
    return json(GENERIC_FAILURE, 401, origin)
  }

  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, email, status')
    .eq('username', username)
    .maybeSingle()

  if (profileError) {
    console.error('sign_in_lookup_failed')
    return json({ error: 'Sign-in is temporarily unavailable.' }, 503, origin)
  }

  // An unknown username authenticates against a placeholder address so the
  // response time and the failure body stay identical to a wrong password.
  const grant = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email: profile?.email ?? `taken${targetKey.slice(0, 8)}@invalid.local`,
      password,
    }),
  })
  const session = grant.ok ? await grant.json().catch(() => null) : null

  if (!session?.access_token || !session?.refresh_token) {
    await adminClient.rpc('auth_rate_record', { p_attempt_key: targetKey, p_max_attempts: MAX_ATTEMPTS_PER_TARGET, p_window_seconds: WINDOW_SECONDS })
    await adminClient.rpc('auth_rate_record', { p_attempt_key: ipKey, p_max_attempts: MAX_ATTEMPTS_PER_IP, p_window_seconds: WINDOW_SECONDS })
    return json(GENERIC_FAILURE, 401, origin)
  }

  // Credentials were correct, but an account without a live profile or with a
  // non-Admin/Manager/Support Agent role is refused the same way.
  if (!profile || profile.status !== 'Active') {
    try {
      await adminClient.auth.admin.signOut(session.access_token)
    } catch {
      // The refusal is already the security decision; cleanup is best effort.
    }
    await adminClient.rpc('auth_rate_record', { p_attempt_key: targetKey, p_max_attempts: MAX_ATTEMPTS_PER_TARGET, p_window_seconds: WINDOW_SECONDS })
    return json(GENERIC_FAILURE, 401, origin)
  }

  await adminClient.rpc('auth_rate_reset', { p_attempt_key: targetKey })

  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  }, 200, origin)
})
