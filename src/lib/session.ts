import { supabase } from './supabase'
import { roleHasPermission, type Permission } from './permissions'
import type { UserRole } from '../types/database'

export interface Actor {
  id: string
  role: UserRole
}

// Services re-read the role from the database rather than trusting the
// client-side context, so a stale or tampered session grants nothing extra.
export async function getActor(): Promise<Actor> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error('You must be signed in to perform this action.')

  const { data, error } = await supabase
    .from('users')
    .select('role_id, roles:role_id(name)')
    .eq('id', user.id)
    .single()

  if (error) throw new Error('Account lookup failed. Please sign in again.')

  const roleData = (data as any)?.roles
  const role = (Array.isArray(roleData) ? roleData[0]?.name : roleData?.name) ?? 'Support Agent'
  return { id: user.id, role }
}

export async function requirePermission(permission: Permission, message?: string): Promise<Actor> {
  const actor = await getActor()
  if (!roleHasPermission(actor.role, permission)) {
    throw new Error(message ?? 'Your role is not allowed to perform this action.')
  }
  return actor
}
