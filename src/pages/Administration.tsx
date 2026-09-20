import { useState } from 'react'
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
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  UserPlus,
  ShieldCheck,
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Manager' | 'Support Agent'
  department: string
  status: 'Active' | 'Inactive'
  lastActive: string
  initials: string
  avatarColor: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  userCount: number
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Youssef Hussein',
    email: 'youssef.hussein@opsmind.com',
    role: 'Admin',
    department: 'Technical Support',
    status: 'Active',
    lastActive: '5 minutes ago',
    initials: 'YH',
    avatarColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 2,
    name: 'Adam Ahmed',
    email: 'adam.ahmed@opsmind.com',
    role: 'Manager',
    department: 'Technical Support',
    status: 'Active',
    lastActive: '2 hours ago',
    initials: 'AA',
    avatarColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 3,
    name: 'Nour El-Din',
    email: 'nour.eldin@opsmind.com',
    role: 'Support Agent',
    department: 'Technical Support',
    status: 'Active',
    lastActive: '1 day ago',
    initials: 'NE',
    avatarColor: 'bg-pink-100 text-pink-700',
  },
  {
    id: 4,
    name: 'Karim Mahmoud',
    email: 'karim.mahmoud@opsmind.com',
    role: 'Support Agent',
    department: 'Technical Support',
    status: 'Active',
    lastActive: '3 days ago',
    initials: 'KM',
    avatarColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 5,
    name: 'Hassan Mostafa',
    email: 'hassan.mostafa@opsmind.com',
    role: 'Support Agent',
    department: 'Technical Support',
    status: 'Inactive',
    lastActive: '1 week ago',
    initials: 'HM',
    avatarColor: 'bg-orange-100 text-orange-700',
  },
]

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system access including user management and configuration',
    permissions: ['Create Documents', 'Edit Documents', 'Delete Documents', 'Approve Documents', 'Manage Users', 'Manage Roles', 'View Reports', 'Export Data'],
    userCount: 1,
  },
  {
    id: 2,
    name: 'Manager',
    description: 'Can manage documents and view reports, but cannot manage users',
    permissions: ['Create Documents', 'Edit Documents', 'Approve Documents', 'View Reports'],
    userCount: 1,
  },
  {
    id: 3,
    name: 'Support Agent',
    description: 'Can create and edit documents, but cannot approve or delete',
    permissions: ['Create Documents', 'Edit Documents', 'View Documents'],
    userCount: 3,
  },
]

const ROLE_STYLES: Record<User['role'], string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  'Support Agent': 'bg-teal-100 text-teal-700',
}

const STATUS_STYLES: Record<User['status'], string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-slate-100 text-slate-600',
}

export function Administration() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'settings'>('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Manager' | 'Support Agent'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All')

  const filteredUsers = mockUsers.filter(user => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All' || user.role === roleFilter
    const matchStatus = statusFilter === 'All' || user.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administration</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage users, roles, and system settings
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add User
        </button>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Users
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mockUsers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mockRoles.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* users tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
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
                  onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
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

          {/* users table */}
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
                            <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${user.avatarColor}`}>
                              {user.initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded ${ROLE_STYLES[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-sm text-slate-600">{user.department}</td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded ${STATUS_STYLES[user.status]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-400 hidden md:table-cell">{user.lastActive}</td>
                        <td className="py-3.5 px-3">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Showing {filteredUsers.length} of {mockUsers.length} users
              </span>
            </div>
          </div>
        </div>
      )}

      {/* roles tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Manage system roles and their permissions
            </p>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              Create Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRoles.map(role => (
              <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 mb-1">{role.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{role.description}</p>

                <div className="space-y-2 mb-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{role.permissions.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">{role.userCount} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Department Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Name
                </label>
                <input
                  type="text"
                  defaultValue="Technical Support"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Code
                </label>
                <input
                  type="text"
                  defaultValue="TS-001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoApprove"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoApprove" className="text-sm text-slate-700">
                  Enable auto-approval for SOPs
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireVersioning"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requireVersioning" className="text-sm text-slate-700">
                  Require version notes for document updates
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Document Retention Period (days)
                </label>
                <input
                  type="number"
                  defaultValue="365"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Maximum File Size (MB)
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableAudit"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enableAudit" className="text-sm text-slate-700">
                  Enable audit logging
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
