import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/database'

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'Employee',
  department = 'Technical Support'
) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!session) throw new Error('You must be signed in as an administrator to create users.')

  console.log('Calling create-user function with:', { email, name, role, department })

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, name, role, department },
  })

  console.log('Function response:', { data, error })

  if (error) {
    console.error('Function invocation error:', error)
    throw error
  }
  if (data?.error) {
    console.error('Function returned error:', data.error)
    throw new Error(data.error)
  }
  
  // Check for success
  if (!data?.success) {
    throw new Error('User creation failed: Unknown error')
  }
  
  return data
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
