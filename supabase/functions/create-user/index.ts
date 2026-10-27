import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Required Supabase function environment variables are missing.')
    return json({ error: 'User creation service is not configured.' }, 500)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  console.log('Caller auth check:', { caller: caller?.id, callerError: callerError?.message })
  if (callerError || !caller) return json({ error: 'Unauthorized - not authenticated' }, 401)

  // Only an existing Admin may create accounts or assign roles.
  const { data: callerProfile, error: profileError } = await adminClient
    .from('users')
    .select('id, roles:role_id(name)')
    .eq('id', caller.id)
    .single()

  console.log('Caller profile check:', { 
    callerProfile, 
    profileError: profileError?.message,
    callerId: caller.id 
  })

  const callerRole = (callerProfile as { roles?: { name?: string } } | null)?.roles?.name
  console.log('Caller role:', callerRole)
  
  if (profileError || callerRole !== 'Admin') {
    console.error('Authorization failed:', { profileError: profileError?.message, callerRole })
    return json({ error: `Only administrators can create users. Your role: ${callerRole || 'none'}` }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  console.log('Received body:', { ...body, password: body.password ? '***' : 'MISSING' })

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const role = typeof body.role === 'string' ? body.role : 'Employee'
  const department = typeof body.department === 'string' && body.department.trim()
    ? body.department.trim()
    : 'Technical Support'

  console.log('Parsed values:', { email, name, role, department, passwordLength: password.length })

  if (!email || !email.includes('@') || !name || password.length < 8) {
    const errorMsg = `Validation failed: email=${!!email}, hasAt=${email.includes('@')}, name=${!!name}, passwordLength=${password.length}`
    console.error(errorMsg)
    return json({ error: 'Provide a valid email, name, and password of at least 8 characters.' }, 400)
  }
  if (!['Admin', 'Manager', 'Employee'].includes(role)) {
    return json({ error: 'Invalid role.' }, 400)
  }

  console.log('Fetching role from database...')
  const { data: roleRow, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', role)
    .single()
  
  console.log('Role fetch result:', { roleRow, roleError: roleError?.message })
  if (roleError || !roleRow) return json({ error: 'Requested role was not found.' }, 400)

  console.log('Creating auth user...')
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  
  console.log('Auth user creation result:', { 
    userId: created?.user?.id, 
    createError: createError?.message 
  })
  
  if (createError || !created.user) {
    return json({ error: createError?.message || 'Could not create the authentication user.' }, 400)
  }

  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').toUpperCase().slice(0, 2)
  
  console.log('Inserting user profile...')
  const { error: insertError } = await adminClient.from('users').insert({
    id: created.user.id,
    email,
    name,
    password_hash: '',
    role_id: roleRow.id,
    department,
    status: 'Active',
    initials,
    avatar_color: 'bg-blue-100 text-blue-700',
  })

  console.log('Profile insert result:', { insertError: insertError?.message })

  if (insertError) {
    // Avoid leaving an Auth account without its matching application profile.
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id)
    if (rollbackError) console.error('Failed to roll back Auth user after profile insert failure:', rollbackError.message)
    console.error('User profile insert failed:', insertError.message)
    return json({ error: 'The user account could not be completed. No application profile was created.' }, 500)
  }

  console.log('User created successfully:', created.user.id)
  return json({ success: true, userId: created.user.id })
})
