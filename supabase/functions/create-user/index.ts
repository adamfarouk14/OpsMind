import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SUPPORTED_ROLES = ['Admin', 'Manager', 'Support Agent']

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
}

// A privileged endpoint must not answer cross-origin requests it cannot name.
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
  return { ...corsHeaders, 'Access-Control-Allow-Origin': origin ?? 'null' }
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(origin) })
}

function initialsFor(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

serve(async (req) => {
  const origin = originFor(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: headersFor(origin) })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Unauthorized' }, 401, origin)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('create_user_config_missing')
    return json({ error: 'User creation service is not configured.' }, 500, origin)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) return json({ error: 'You must be signed in.' }, 401, origin)

  // Only an active Admin may create accounts or grant roles. There is no
  // email-based shortcut and no fallback to a weaker credential.
  const { data: callerProfile, error: profileError } = await adminClient
    .from('users')
    .select('id, status, roles:role_id(name)')
    .eq('id', caller.id)
    .single()

  const callerRole = (callerProfile as { roles?: { name?: string } } | null)?.roles?.name
  if (profileError || callerProfile?.status !== 'Active' || callerRole !== 'Admin') {
    return json({ error: 'Only administrators can create users.' }, 403, origin)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400, origin)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const role = typeof body.role === 'string' ? body.role : 'Support Agent'
  const department = typeof body.department === 'string' && body.department.trim()
    ? body.department.trim()
    : 'Technical Support'

  if (!EMAIL_PATTERN.test(email)) return json({ error: 'Provide a valid email address.' }, 400, origin)
  if (!USERNAME_PATTERN.test(username)) {
    return json({ error: 'Username must be 3-32 characters using lowercase letters, digits, dot, underscore or hyphen.' }, 400, origin)
  }
  if (!name || name.length < 2 || name.length > 80) return json({ error: 'Provide the full name.' }, 400, origin)
  if (password.length < 8 || password.length > 128) {
    return json({ error: 'Password must be at least 8 characters.' }, 400, origin)
  }
  if (!SUPPORTED_ROLES.includes(role)) return json({ error: 'Invalid role.' }, 400, origin)

  const { data: roleRow, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', role)
    .maybeSingle()
  if (roleError || !roleRow) return json({ error: 'Requested role was not found.' }, 400, origin)

  const { data: takenEmail } = await adminClient.from('users').select('id').eq('email', email).maybeSingle()
  if (takenEmail) return json({ error: 'An account already uses this email address.' }, 409, origin)

  const { data: takenUsername } = await adminClient.from('users').select('id').eq('username', username).maybeSingle()
  if (takenUsername) return json({ error: 'That username is already taken.' }, 409, origin)

  // Accounts created by an Admin are usable immediately; self-registered
  // accounts go through the register function, which requires confirmation.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: name },
  })

  if (createError || !created?.user) {
    return json({ error: createError?.message || 'Could not create the authentication user.' }, 400, origin)
  }

  const { error: insertError } = await adminClient.from('users').insert({
    id: created.user.id,
    email,
    username,
    name,
    password_hash: '',
    role_id: roleRow.id,
    department,
    status: 'Active',
    initials: initialsFor(name),
    avatar_color: role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
  })

  if (insertError) {
    // Avoid leaving an Auth account without its matching application profile.
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id)
    if (rollbackError) console.error('create_user_rollback_failed')
    console.error('create_user_profile_insert_failed', insertError.code ?? 'unknown')
    return json({ error: 'The user account could not be completed. No application profile was created.' }, 500, origin)
  }

  return json({ success: true, userId: created.user.id }, 200, origin)
})
