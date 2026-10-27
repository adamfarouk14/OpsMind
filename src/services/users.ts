import { supabase } from '../lib/supabase'
import type { UserWithRole, UserStatus } from '../types/database'

export async function getUsers(): Promise<UserWithRole[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
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
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as UserWithRole[]
}

export async function getUserById(id: string): Promise<UserWithRole> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
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
  return data as unknown as UserWithRole
}

export async function createUser(user: {
  email: string
  name: string
  password_hash: string
  role_id: string
  department?: string
  initials?: string
  avatar_color?: string
}) {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select(`
      id,
      email,
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

export async function updateUser(id: string, updates: {
  name?: string
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
      email,
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

export async function deactivateUser(id: string) {
  // Direct update using authenticated user's permissions
  // Since we don't have service_role access, we'll update directly
  const { error } = await supabase
    .from('users')
    .update({ status: 'Inactive' })
    .eq('id', id)

  if (error) throw error
}

export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}