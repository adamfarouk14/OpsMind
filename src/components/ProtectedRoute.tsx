import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { roleHasPermission, type Permission } from '../lib/permissions'
import type { UserRole } from '../types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: Permission
}

export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const roleMatches = !requiredRole || user.role === requiredRole
  const permissionMatches = !requiredPermission || roleHasPermission(user.role, requiredPermission)

  if (!roleMatches || !permissionMatches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
