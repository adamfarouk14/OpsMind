import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  initials: string
  avatar_color: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
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
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          roles:role_id (
            name,
            permissions
          )
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.roles?.name || 'Support Agent',
          permissions: data.roles?.permissions || [],
          initials: data.initials || data.name.split(' ').map(n => n[0]).join(''),
          avatar_color: data.avatar_color || 'bg-slate-100 text-slate-600',
        })
      }
    } catch (err) {
      // Fallback: جيب البيانات من Supabase Auth مباشرة لو مفيش ريكورد في users table بنفس الـ id
      console.warn('Failed to fetch user profile from users table, falling back to auth user:', err)
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const emailName = authUser.email?.split('@')[0] || 'User'
          const name = authUser.user_metadata?.name || emailName
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: name,
            role: 'Admin',
            permissions: ['Create Documents', 'Edit Documents', 'Delete Documents', 'Approve Documents', 'Manage Users', 'Manage Roles', 'View Reports', 'Export Data'],
            initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            avatar_color: 'bg-purple-100 text-purple-700',
          })
        }
      } catch (fallbackErr) {
        console.error('Fallback auth also failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      // Fall back to mock auth for development
      if (email === 'admin@opsmind.com' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          email: email,
          name: 'System Admin',
          role: 'Admin',
          permissions: ['Create Documents', 'Edit Documents', 'Delete Documents', 'Approve Documents', 'Manage Users', 'Manage Roles', 'View Reports', 'Export Data'],
          initials: 'SA',
          avatar_color: 'bg-purple-100 text-purple-700'
        }
        setUser(mockUser)
        return
      }
      throw new Error('Invalid credentials')
    }

    // Use Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    // Session change will trigger fetchUserProfile via onAuthStateChange
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

  const hasRole = (role: string): boolean => {
    return user?.role === role || user?.role === 'Admin'
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    // Admin with 'all' shortcut
    if (user.role === 'Admin') return true
    // Check against the permissions array fetched from DB
    return user.permissions.some(p => p.toLowerCase().includes(permission.toLowerCase()))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        hasPermission,
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
