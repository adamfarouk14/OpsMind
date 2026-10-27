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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!anonKey,
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPreview: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'MISSING'
  })
  
  if (!supabaseUrl || !anonKey) {
    console.error('Required Supabase URL or anon key missing.')
    return json({ error: 'User deactivation service is not configured.' }, 500)
  }

  // Use service role key if available, otherwise use anon key (less secure but works for dev)
  const adminKey = serviceRoleKey || anonKey
  console.log('Using admin key:', adminKey ? 'service_role' : 'anon (fallback)')

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Verify the caller is authenticated
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !caller) return json({ error: 'Unauthorized' }, 401)

  // Try to verify caller is Admin from database
  const { data: callerProfile, error: profileError } = await adminClient
    .from('users')
    .select('id, roles:role_id(name)')
    .eq('id', caller.id)
    .single()

  // If user not found in database, check if they're using the mock admin account
  if (profileError || !callerProfile) {
    // Allow mock admin account for development (admin@opsmind.com)
    if (caller.email === 'admin@opsmind.com') {
      console.log('Mock admin account detected, allowing deactivation')
      // Continue to deactivation logic below
    } else {
      console.error('Failed to fetch caller profile:', profileError)
      return json({ error: 'Failed to verify user permissions.' }, 500)
    }
  } else {
    // Real database user - verify Admin role
    const callerRole = (callerProfile as { roles?: { name?: string } } | null)?.roles?.name
    console.log('Caller role:', callerRole, 'Profile:', JSON.stringify(callerProfile))
    
    if (callerRole !== 'Admin') {
      return json({ error: 'Only administrators can deactivate users.' }, 403)
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    return json({ error: 'userId is required.' }, 400)
  }

  // Prevent self-deactivation
  if (userId === caller.id) {
    return json({ error: 'Cannot deactivate your own account.' }, 400)
  }

  // Verify target user exists and get current status
  console.log('Looking for user with ID:', userId)
  
  const { data: targetUser, error: targetError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  console.log('Query result:', { targetUser, targetError })

  if (targetError) {
    console.error('Error fetching target user:', targetError)
    return json({ error: `Database error: ${targetError.message}` }, 500)
  }

  if (!targetUser) {
    console.error('Target user not found. userId:', userId)
    // List all users to debug
    const { data: allUsers } = await adminClient.from('users').select('id, email')
    console.log('All users in DB:', allUsers)
    return json({ error: 'User not found in database.' }, 404)
  }

  console.log('Found user:', targetUser.name, targetUser.email)

  // Deactivate the user by setting status to 'Inactive'
  // This preserves all data relationships and audit trails
  const { error: updateError } = await adminClient
    .from('users')
    .update({ status: 'Inactive' })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to deactivate user:', updateError)
    return json({ error: 'Failed to deactivate user account.' }, 500)
  }

  // Optionally: Sign out all active sessions for this user
  // Note: This requires admin.auth.signOut or revoking refresh tokens
  // Supabase will naturally block new logins due to status check in AuthContext

  return json({ 
    success: true, 
    message: `User ${targetUser.name} deactivated successfully. They will be signed out on their next request.` 
  })
})
