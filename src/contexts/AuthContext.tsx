import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { signInWithUsername } from '../services/auth'
import { isValidRole, roleHasPermission, type Permission } from '../lib/permissions'
import type { UserRole } from '../types/database'

interface User {
  id: string
  email: string
  username: string
  name: string
  role: UserRole
  permissions: Permission[]
  initials: string
  avatar_color: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (role: UserRole) => boolean
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL'

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Check for existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email ?? '').catch(err => console.error('Profile fetch failed:', err))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email ?? '').catch(err => console.error('Profile fetch failed:', err))
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
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
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        // Enforce account status - block Inactive users
        if (data.status !== 'Active') {
          console.warn('User account is inactive, signing out')
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          throw new Error('Your account has been deactivated. Please contact an administrator.')
        }

        // Extract role from the joined query result
        const roleData = data.roles as { name: string; permissions: string[] } | { name: string; permissions: string[] }[] | null
        const roleName = (Array.isArray(roleData) ? roleData[0]?.name : roleData?.name) ?? null
        const rolePermissions = (Array.isArray(roleData) ? roleData[0]?.permissions : roleData?.permissions) ?? []

        // No role, or a role outside the three supported ones, grants nothing.
        if (!isValidRole(roleName)) {
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          throw new Error('This account has no valid role assigned. Please contact an administrator.')
        }

        setUser({
          id: data.id,
          email,
          username: data.username ?? '',
          name: data.name,
          role: roleName,
          permissions: rolePermissions as Permission[],
          initials: data.initials || data.name.split(' ').map((n: string) => n[0]).join(''),
          avatar_color: data.avatar_color || 'bg-slate-100 text-slate-600',
        })
      }
    } catch (err) {
      // Profile fetch failed — sign the user out rather than granting any role
      console.error('Failed to fetch user profile, signing out for safety:', err)
      await supabase.auth.signOut()
      setUser(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL to sign in.')
    }

    const tokens = await signInWithUsername(username, password)

    const { error: sessionError } = await supabase.auth.setSession(tokens)
    if (sessionError) throw sessionError

    // The profile is read from the established session, never from the
    // login response.
    const { data: { user: signedIn } } = await supabase.auth.getUser()
    if (!signedIn) throw new Error('Sign in did not establish a session')

    await fetchUserProfile(signedIn.id, signedIn.email ?? '')
  }

  const logout = async () => {
    // Check if using mock auth
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      setUser(null)
      return
    }

    // Use Supabase auth
    await supabase.auth.signOut()
    setUser(null)
  }

  const hasRole = (role: UserRole): boolean => user?.role === role

  const can = (permission: Permission): boolean => roleHasPermission(user?.role, permission)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
