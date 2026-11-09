import { supabase } from '../lib/supabase'
import { readFunctionError } from './auth'
import type { UserRole, UserWithRole, UserStatus } from '../types/database'

interface AccountRow {
  id: string
  email: string
  username: string
  name: string
  role_id: string | null
  role_name: string | null
  permissions: string[] | null
  department: string
  status: UserStatus
  initials: string | null
  avatar_color: string | null
  last_active_at: string | null
  created_at: string
  updated_at: string
}

const ACCOUNT_COLUMNS = `
  id,
  email,
  username,
  name,
  role_id,
  role_name,
  permissions,
  department,
  status,
  initials,
  avatar_color,
  last_active_at,
  created_at,
  updated_at
`

// user_accounts is an Admin-only projection: it returns no rows for any other
// role, and it is the only place an email address is readable from the client.
function toUserWithRole(row: AccountRow): UserWithRole {
  return {
    ...row,
    roles: row.role_name
      ? { name: row.role_name as UserRole, permissions: row.permissions ?? [] }
      : undefined,
  }
}

export async function getUsers(): Promise<UserWithRole[]> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select(ACCOUNT_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(toUserWithRole)
}

export async function getUserById(id: string): Promise<UserWithRole | null> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toUserWithRole(data as AccountRow) : null
}

export async function getOwnProfile(id: string) {
  // Own row, no email: the address comes from the auth session instead.
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      name,
      role_id,
      department,
      status,
      initials,
      avatar_color,
      last_active_at,
      created_at,
      updated_at,
      roles:role_id (
        name,
        permissions
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateUser(id: string, updates: {
  name?: string
  username?: string
  role_id?: string
  department?: string
  status?: UserStatus
  initials?: string
  avatar_color?: string
}) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select(`
      id,
      username,
      name,
      role_id,
      department,
      status,
      initials,
      avatar_color,
      last_active_at,
      created_at,
      updated_at
    `)
    .single()

  if (error) throw error
  return data
}

// Removes the application profile and its Auth account together, Admin only.
export async function deleteUserAccount(id: string) {
  const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId: id } })
  if (error || !data?.success) {
    throw await readFunctionError(error, data)
  }
  return data
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_accounts')
    .select('id', { count: 'exact', head: true })
    .ilike('username', username)

  // A non-Admin caller gets zero rows from the view, so this is Admin-only.
  if (error) throw error
  return (count ?? 0) === 0
}

export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}
