import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/database'

export async function signUp(email: string, password: string, name: string, role: UserRole = 'Support Agent') {
  // First, create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  if (authData.user) {
    // Get the role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single()

    if (roleError) throw roleError

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        password_hash: '', // Auth handles password
        role_id: roleData.id,
        department: 'Technical Support',
        status: 'Active',
        initials: name.split(' ').map(n => n[0]).join(''),
        avatar_color: 'bg-blue-100 text-blue-700',
      })

    if (userError) throw userError
  }

  return authData
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
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
