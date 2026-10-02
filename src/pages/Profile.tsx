import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateUser, getUserById } from '../services/users'
import { getActivityLogs } from '../services/activityLogs'
import {
  User,
  Mail,
  Building2,
  Shield,
  Save,
  ArrowLeft,
  Edit2,
  Loader2,
  Lock,
} from 'lucide-react'

export function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [department, setDepartment] = useState('Technical Support')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: 'Technical Support',
  })

  const [stats, setStats] = useState({
    created: 0,
    edited: 0,
    approved: 0,
    memberSince: '',
  })

  useEffect(() => {
    if (!user?.id) return

    async function loadData() {
      try {
        const [logs, dbUser] = await Promise.all([
          getActivityLogs(500),
          getUserById(user!.id),
        ])

        // Set real department from DB
        const realDept = dbUser?.department || 'Technical Support'
        setDepartment(realDept)
        setFormData(prev => ({ ...prev, department: realDept }))

        const myLogs = logs.filter((l: any) => l.user_id === user!.id)
        const created = myLogs.filter((l: any) => l.action === 'create').length
        const edited = myLogs.filter((l: any) => l.action === 'edit').length
        const approved = myLogs.filter((l: any) => l.action === 'approve').length

        const earliest = myLogs.length > 0
          ? new Date(myLogs[myLogs.length - 1].created_at)
          : new Date()

        setStats({
          created,
          edited,
          approved,
          memberSince: earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        })
      } catch (err) {
        console.error('Failed to load profile data:', err)
      }
    }

    loadData()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const initials = formData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      await updateUser(user.id, {
        name: formData.name,
        department: formData.department,
        initials,
      })

      setEditing(false)
      // Reload the page so AuthContext re-fetches fresh user data
      window.location.reload()
    } catch (err) {
      setError('Failed to save: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department,
    })
    setEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your account information</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* profile card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${user?.avatar_color || 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'}`}>
                  {user?.initials || 'U'}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">{user?.name || 'User'}</h2>
              <p className="text-sm text-slate-500">{user?.email || 'user@example.com'}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">{user?.role || 'Team Member'}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* account stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Account Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Documents Created</span>
                <span className="text-sm font-semibold text-slate-900">{stats.created}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Documents Edited</span>
                <span className="text-sm font-semibold text-slate-900">{stats.edited}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Approvals Given</span>
                <span className="text-sm font-semibold text-slate-900">{stats.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Member Since</span>
                <span className="text-sm font-semibold text-slate-900">{stats.memberSince || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{user?.name || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-900">{user?.email || 'N/A'}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-900">{department}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <p className="text-sm text-slate-900">{user?.role || 'Team Member'}</p>
                </div>
              </div>
            </div>

            {editing && (
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* security section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Security</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Change Password</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Two-Factor Authentication</span>
                </div>
                <span className="text-xs text-slate-400">Disabled</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
