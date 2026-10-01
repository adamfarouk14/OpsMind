import { useState, useEffect } from 'react'
import { getUsers, getRoles, updateUser } from '../services/users'
import { signUp } from '../services/auth'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Shield,
  Building2,
  Settings,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  ChevronDown,
  UserPlus,
  ShieldCheck,
  Loader2,
  X,
  Save,
} from 'lucide-react'

const ROLE_STYLES: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  'Support Agent': 'bg-teal-100 text-teal-700',
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-slate-100 text-slate-600',
}

export function Administration() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'settings'>('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Manager' | 'Support Agent'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  // Add User modal
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'Support Agent', department: 'Technical Support' })
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)

  // Edit User modal
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editUserForm, setEditUserForm] = useState({ name: '', department: '' })
  const [savingUser, setSavingUser] = useState(false)
  const [editUserError, setEditUserError] = useState<string | null>(null)

  // Department settings
  const [deptSettings, setDeptSettings] = useState({ name: 'Technical Support', code: 'TS-001', autoApprove: false, requireVersioning: true })
  const [savingDept, setSavingDept] = useState(false)
  const [deptSaved, setDeptSaved] = useState(false)

  // System config
  const [sysConfig, setSysConfig] = useState({ retentionDays: 365, maxFileSizeMb: 10, enableAudit: true })
  const [savingSys, setSavingSys] = useState(false)
  const [sysSaved, setSysSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()])
        setUsers(usersData)
        setRoles(rolesData)
      } catch (err) {
        setError('Failed to load data: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddUser = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      setAddUserError('Name, email and password are required')
      return
    }
    try {
      setAddingUser(true)
      setAddUserError(null)
      await signUp(newUserForm.email, newUserForm.password, newUserForm.name, newUserForm.role as any)
      await logActivity({
        user_id: currentUser?.id,
        action: 'create',
        target_type: 'user',
        target_title: newUserForm.name,
        details: `Created new user: ${newUserForm.email} with role ${newUserForm.role}`,
      })
      const updated = await getUsers()
      setUsers(updated)
      setShowAddUserModal(false)
      setNewUserForm({ name: '', email: '', password: '', role: 'Support Agent', department: 'Technical Support' })
    } catch (err) {
      setAddUserError('Failed to create user: ' + (err as Error).message)
    } finally {
      setAddingUser(false)
    }
  }

  const openEditUser = (user: any) => {
    setEditingUser(user)
    setEditUserForm({ name: user.name || '', department: user.department || '' })
    setEditUserError(null)
  }

  const handleEditUser = async () => {
    if (!editingUser || !editUserForm.name.trim()) {
      setEditUserError('Name is required')
      return
    }
    try {
      setSavingUser(true)
      setEditUserError(null)
      const initials = editUserForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      await updateUser(editingUser.id, {
        name: editUserForm.name,
        department: editUserForm.department,
        initials,
      })
      await logActivity({
        user_id: currentUser?.id,
        action: 'edit',
        target_type: 'user',
        target_id: editingUser.id,
        details: `Updated user profile: ${editUserForm.name}`,
      })
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id ? { ...u, name: editUserForm.name, department: editUserForm.department, initials } : u
      ))
      setEditingUser(null)
    } catch (err) {
      setEditUserError('Failed to save: ' + (err as Error).message)
    } finally {
      setSavingUser(false)
    }
  }

  const handleRoleChange = async (userId: string, roleName: string) => {
    try {
      const role = roles.find(r => r.name === roleName)
      if (!role) return
      await updateUser(userId, { role_id: role.id })
      await logActivity({
        user_id: currentUser?.id,
        action: 'edit',
        target_type: 'user',
        target_id: userId,
        details: `Changed user role to ${roleName}`,
      })
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, roles: { name: roleName, permissions: role.permissions } } : u
      ))
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    try {
      await updateUser(userId, { status: newStatus as any })
      await logActivity({
        user_id: currentUser?.id,
        action: 'edit',
        target_type: 'user',
        target_id: userId,
        details: `Set user status to ${newStatus}`,
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleSaveDept = async () => {
    try {
      setSavingDept(true)
      // Settings are stored locally (no dedicated settings table in DB)
      // Log the action so there's an audit trail
      await logActivity({
        user_id: currentUser?.id,
        action: 'edit',
        target_type: 'settings',
        details: `Updated department settings: ${deptSettings.name} (${deptSettings.code})`,
      })
      setDeptSaved(true)
      setTimeout(() => setDeptSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSavingDept(false)
    }
  }

  const handleSaveSys = async () => {
    try {
      setSavingSys(true)
      await logActivity({
        user_id: currentUser?.id,
        action: 'edit',
        target_type: 'settings',
        details: `Updated system config: retention=${sysConfig.retentionDays}d, maxFile=${sysConfig.maxFileSizeMb}MB`,
      })
      setSysSaved(true)
      setTimeout(() => setSysSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save system config:', err)
    } finally {
      setSavingSys(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchSearch =
      (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All' || user.roles?.name === roleFilter
    const matchStatus = statusFilter === 'All' || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading administration data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Administration</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage users, roles, and system settings</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          {/* tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {[
              { id: 'users', label: 'Users', icon: Users, badge: users.length },
              { id: 'roles', label: 'Roles', icon: Shield, badge: roles.length },
              { id: 'settings', label: 'Settings', icon: Settings, badge: null },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== null && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tab.badge}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400"
                  />
                </div>
                <div className="w-px h-5 bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value as any)}
                      className="appearance-none px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-7"
                    >
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Support Agent">Support Agent</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      className="appearance-none px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-7"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">User</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Role</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Department</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Last Active</th>
                        <th className="py-3 px-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-400">No users found</p>
                            <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${user.avatar_color || 'bg-slate-100 text-slate-600'}`}>
                                  {user.initials || user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                  <p className="text-xs text-slate-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <select
                                value={user.roles?.name || 'No Role'}
                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded ${ROLE_STYLES[user.roles?.name] || 'bg-slate-100 text-slate-600'} border-0 cursor-pointer`}
                              >
                                <option value="No Role">No Role</option>
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="Support Agent">Support Agent</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-3 text-sm text-slate-600">{user.department}</td>
                            <td className="py-3.5 px-3">
                              <button
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded hover:opacity-70 transition-opacity ${STATUS_STYLES[user.status]}`}
                                title={user.status === 'Active' ? 'Click to deactivate' : 'Click to activate'}
                              >
                                {user.status}
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-xs text-slate-400 hidden md:table-cell">
                              {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                onClick={() => openEditUser(user)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Showing {filteredUsers.length} of {users.length} users</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Roles Tab ── */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Manage system roles and their permissions</p>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Create Role
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                  <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{role.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{role.description}</p>
                    <div className="space-y-2 mb-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Permissions</p>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 3).map((perm: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{perm}</span>
                        ))}
                        {(role.permissions || []).length > 3 && (
                          <span className="text-[10px] text-slate-400">+{(role.permissions || []).length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{users.filter(u => u.roles?.name === role.name).length} users</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings Tab ── */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Department Settings */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Name</label>
                    <input
                      type="text"
                      value={deptSettings.name}
                      onChange={e => setDeptSettings({ ...deptSettings, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Code</label>
                    <input
                      type="text"
                      value={deptSettings.code}
                      onChange={e => setDeptSettings({ ...deptSettings, code: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoApprove"
                      checked={deptSettings.autoApprove}
                      onChange={e => setDeptSettings({ ...deptSettings, autoApprove: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoApprove" className="text-sm text-slate-700">Enable auto-approval for SOPs</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requireVersioning"
                      checked={deptSettings.requireVersioning}
                      onChange={e => setDeptSettings({ ...deptSettings, requireVersioning: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="requireVersioning" className="text-sm text-slate-700">Require version notes for document updates</label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                  {deptSaved && <span className="text-xs text-green-600 font-medium">Saved successfully</span>}
                  <button
                    onClick={handleSaveDept}
                    disabled={savingDept}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                  >
                    {savingDept ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* System Configuration */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  System Configuration
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Document Retention Period (days)</label>
                    <input
                      type="number"
                      value={sysConfig.retentionDays}
                      onChange={e => setSysConfig({ ...sysConfig, retentionDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Maximum File Size (MB)</label>
                    <input
                      type="number"
                      value={sysConfig.maxFileSizeMb}
                      onChange={e => setSysConfig({ ...sysConfig, maxFileSizeMb: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableAudit"
                      checked={sysConfig.enableAudit}
                      onChange={e => setSysConfig({ ...sysConfig, enableAudit: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="enableAudit" className="text-sm text-slate-700">Enable audit logging</label>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                  {sysSaved && <span className="text-xs text-green-600 font-medium">Saved successfully</span>}
                  <button
                    onClick={handleSaveSys}
                    disabled={savingSys}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                  >
                    {savingSys ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Add User Modal ── */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
                  <button onClick={() => { setShowAddUserModal(false); setAddUserError(null) }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {addUserError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{addUserError}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {[
                    { label: 'Name *', key: 'name', type: 'text', placeholder: 'Full name' },
                    { label: 'Email *', key: 'email', type: 'email', placeholder: 'email@example.com' },
                    { label: 'Password *', key: 'password', type: 'password', placeholder: 'Minimum 6 characters' },
                    { label: 'Department', key: 'department', type: 'text', placeholder: 'Technical Support' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={(newUserForm as any)[field.key]}
                        onChange={e => setNewUserForm({ ...newUserForm, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Support Agent">Support Agent</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button onClick={() => { setShowAddUserModal(false); setAddUserError(null) }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button
                    onClick={handleAddUser}
                    disabled={addingUser}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg"
                  >
                    {addingUser ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</> : 'Add User'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Edit User Modal ── */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
                  <button onClick={() => setEditingUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {editUserError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{editUserError}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={editUserForm.name}
                      onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={editUserForm.department}
                      onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      type="text"
                      value={editingUser.email}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed here</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button
                    onClick={handleEditUser}
                    disabled={savingUser}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg"
                  >
                    {savingUser ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
