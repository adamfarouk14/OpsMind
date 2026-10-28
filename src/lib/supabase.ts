import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Wire up auth state changes to functions client
// This ensures the Authorization header is included in function invocations
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) {
    supabase.functions.setAuth(session.access_token)
  }
})

// Set initial auth if user is already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.access_token) {
    supabase.functions.setAuth(session.access_token)
  }
})
