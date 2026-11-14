import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json',
}

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

// Hard deletion of an account. Prefer deactivation: this removes the Auth
// account and its profile, and refuses whenever history would be broken.
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
    console.error('delete_user_config_missing')
    return json({ error: 'User deletion service is not configured.' }, 500, origin)
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

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('users')
    .select('id, status, roles:role_id(name)')
    .eq('id', caller.id)
    .single()

  const callerRole = (callerProfile as { roles?: { name?: string } } | null)?.roles?.name
  if (callerProfileError || callerProfile?.status !== 'Active' || callerRole !== 'Admin') {
    return json({ error: 'Only administrators can delete users.' }, 403, origin)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400, origin)
  }

  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!userId || userId === caller.id) {
    return json({ error: 'You cannot delete your own account.' }, 400, origin)
  }

  const { data: target, error: targetError } = await adminClient
    .from('users')
    .select('id, status, roles:role_id(name)')
    .eq('id', userId)
    .maybeSingle()

  if (targetError) return json({ error: 'Could not read the account.' }, 500, origin)
  if (!target) return json({ error: 'Account not found.' }, 404, origin)

  const { count: docCount } = await adminClient.from('documents').select('id', { count: 'exact', head: true }).eq('owner_id', userId)
  const { count: versionCount } = await adminClient.from('document_versions').select('id', { count: 'exact', head: true }).eq('author_id', userId)
  const { count: approvalCount } = await adminClient.from('approvals').select('id', { count: 'exact', head: true }).eq('approver_id', userId)
  const { count: logCount } = await adminClient.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const { count: notificationCount } = await adminClient.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId)

  const { count: attachmentCount, error: attachmentError } = await adminClient
    .from('document_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('uploaded_by', userId)

  const { count: cleanupCount, error: cleanupError } = await adminClient
    .from('attachment_cleanup_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requested_by', userId)

  // Before the registry migration these tables do not exist, so they block nothing.
  if ((attachmentError && attachmentError.code !== '42P01') || (cleanupError && cleanupError.code !== '42P01')) {
    console.error('delete_user_attachment_check_failed', attachmentError?.code ?? cleanupError?.code ?? 'unknown')
    return json({ error: 'The attachment records of this account could not be checked.' }, 500, origin)
  }

  const related: string[] = []
  if ((docCount ?? 0) > 0) related.push(`${docCount} document(s) they own`)
  if ((versionCount ?? 0) > 0) related.push(`${versionCount} document version(s) they authored`)
  if ((approvalCount ?? 0) > 0) related.push(`${approvalCount} approval(s) they recorded`)
  if ((logCount ?? 0) > 0) related.push(`${logCount} activity log(s) naming them`)
  if ((notificationCount ?? 0) > 0) related.push(`${notificationCount} notification(s) addressed to them`)
  if ((attachmentCount ?? 0) > 0) {
    related.push(`${attachmentCount} attachment record(s) crediting them as the uploader - their files would stay in Storage`)
  }
  if ((cleanupCount ?? 0) > 0) related.push(`${cleanupCount} file cleanup request(s) they opened`)

  if (related.length > 0) {
    return json({
      error: `This account is still referenced: ${related.join(', ')}. Deactivate it instead of deleting it.`,
    }, 409, origin)
  }

  const { error: deleteProfileError } = await adminClient.from('users').delete().eq('id', userId)
  if (deleteProfileError) {
    // The database trigger uses this message when an Admin would be removed.
    if (deleteProfileError.message?.includes('last active Admin')) {
      return json({ error: 'OpsMind must keep at least one active Admin account.' }, 409, origin)
    }
    // A reference created between the check and the delete still stops it here.
    if (deleteProfileError.code === '23503') {
      return json({ error: 'This account is still referenced by records that must be kept. Deactivate it instead of deleting it.' }, 409, origin)
    }
    console.error('delete_user_profile_failed', deleteProfileError.code ?? 'unknown')
    return json({ error: 'The account could not be removed.' }, 500, origin)
  }

  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteAuthError) {
    // The profile is already gone, so the login path can no longer reach this
    // account; report honestly instead of claiming a complete deletion.
    console.error('delete_user_auth_remnant', deleteAuthError.code ?? 'unknown')
    return json({
      error: 'The profile was removed, but the authentication account could not. Sign-out for this account is already blocked.',
    }, 500, origin)
  }

  return json({ success: true }, 200, origin)
})
