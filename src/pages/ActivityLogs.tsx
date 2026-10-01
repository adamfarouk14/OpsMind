import { useState, useEffect } from 'react'
import { getActivityLogs } from '../services/activityLogs'
import {
  Search,
  Filter,
  Clock,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react'

type ActionType = 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'download' | 'view'

const ACTION_STYLES: Record<ActionType, { icon: React.ElementType; color: string; label: string }> = {
  create: { icon: FileText, color: 'bg-blue-100 text-blue-700', label: 'Created' },
  edit: { icon: Edit, color: 'bg-amber-100 text-amber-700', label: 'Edited' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-700', label: 'Deleted' },
  approve: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
  reject: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  download: { icon: Download, color: 'bg-teal-100 text-teal-700', label: 'Downloaded' },
  view: { icon: FileText, color: 'bg-slate-100 text-slate-600', label: 'Viewed' },
}

export function ActivityLogs() {
  const [search, setSearch] = useState('')
  const [activeAction, setActiveAction] = useState<ActionType | 'All'>('All')
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Last 7 Days' | 'Last 30 Days'>('All')
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadActivityLogs() {
      try {
        const data = await getActivityLogs(100)
        setActivityLogs(data)
      } catch (err) {
        setError('Failed to load activity logs: ' + (err as Error).message)
        console.error('Error loading activity logs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadActivityLogs()
  }, [])

  const filteredLogs = activityLogs.filter(log => {
    const matchSearch =
      (log.users?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.target_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.target_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase())

    const matchAction = activeAction === 'All' || log.action === activeAction

    const matchDate = (() => {
      if (dateFilter === 'All') return true
      const logDate = new Date(log.created_at)
      const now = new Date()
      if (dateFilter === 'Today') {
        return logDate.toDateString() === now.toDateString()
      }
      if (dateFilter === 'Last 7 Days') {
        const cutoff = new Date(now)
        cutoff.setDate(now.getDate() - 7)
        return logDate >= cutoff
      }
      if (dateFilter === 'Last 30 Days') {
        const cutoff = new Date(now)
        cutoff.setDate(now.getDate() - 30)
        return logDate >= cutoff
      }
      return true
    })()

    return matchSearch && matchAction && matchDate
  })

  const handleExport = () => {
    const headers = ['Date', 'User', 'Action', 'Document', 'Code', 'Details', 'IP']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.users?.name || 'Unknown',
      log.action,
      log.target_title || '',
      log.target_code || '',
      log.details || '',
      log.ip_address || '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading activity logs...</span>
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
          <h1 className="text-xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track all user actions and system activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{activityLogs.length} Total Activities</span>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        {/* search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by user, document, or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
          />
        </div>

        {/* divider */}
        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* action filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Action:</span>
          <div className="relative">
            <select
              value={activeAction}
              onChange={e => setActiveAction(e.target.value as ActionType | 'All')}
              className="appearance-none px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-7"
            >
              <option value="All">All Actions</option>
              <option value="create">Create</option>
              <option value="edit">Edit</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="download">Download</option>
              <option value="view">View</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* date filter */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <div className="relative">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as 'All' | 'Today' | 'Last 7 Days' | 'Last 30 Days')}
              className="appearance-none px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-7"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* activity list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">No activity found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const actionConfig = ACTION_STYLES[log.action as ActionType] || ACTION_STYLES.view
              const ActionIcon = actionConfig.icon

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* action icon */}
                    <div className={`w-10 h-10 rounded-lg ${actionConfig.color} flex items-center justify-center flex-shrink-0`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${log.users?.avatar_color || 'bg-slate-100 text-slate-600'}`}>
                          {log.users?.initials || log.users?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{log.users?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${actionConfig.color}`}>
                          {actionConfig.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 mb-1">
                        <span className="font-medium text-slate-900">{log.target_title || 'Unknown target'}</span>
                        {log.target_code && <span className="text-slate-400"> ({log.target_code})</span>}
                      </p>

                      <p className="text-xs text-slate-500">{log.details || 'No details'}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        {log.ip_address && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <AlertCircle className="w-3 h-3" />
                            {log.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Showing {filteredLogs.length} of {activityLogs.length} activities
          </span>
          <button onClick={handleExport} className="text-xs text-blue-600 hover:underline font-medium">
            Export Logs
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
