import { supabase } from '../lib/supabase'
import type { UserWithRole, UserRole, UserStatus } from '../types/database'

export async function getUsers(): Promise<UserWithRole[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      roles:role_id (
        name,
        permissions
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as UserWithRole[]
}

export async function getUserById(id: string): Promise<UserWithRole> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      roles:role_id (
        name,
        permissions
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as UserWithRole
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
    .select()
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
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
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