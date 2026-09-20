import { useState } from 'react'
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
} from 'lucide-react'

type ActionType = 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'download' | 'view'

interface ActivityLog {
  id: number
  user: string
  userInitials: string
  userColor: string
  action: ActionType
  target: string
  targetCode: string
  details: string
  timestamp: string
  ipAddress: string
}

const ACTION_STYLES: Record<ActionType, { icon: React.ElementType; color: string; label: string }> = {
  create: { icon: FileText, color: 'bg-blue-100 text-blue-700', label: 'Created' },
  edit: { icon: Edit, color: 'bg-amber-100 text-amber-700', label: 'Edited' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-700', label: 'Deleted' },
  approve: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
  reject: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  download: { icon: Download, color: 'bg-teal-100 text-teal-700', label: 'Downloaded' },
  view: { icon: FileText, color: 'bg-slate-100 text-slate-600', label: 'Viewed' },
}

const mockActivityLogs: ActivityLog[] = [
  {
    id: 1,
    user: 'Adam Ahmed',
    userInitials: 'AA',
    userColor: 'bg-indigo-100 text-indigo-700',
    action: 'approve',
    target: 'POS Installation SOP',
    targetCode: 'SOP-101',
    details: 'Approved document v2.1 for publication',
    timestamp: '15 minutes ago',
    ipAddress: '192.168.1.45',
  },
  {
    id: 2,
    user: 'Nour El-Din',
    userInitials: 'NE',
    userColor: 'bg-pink-100 text-pink-700',
    action: 'edit',
    target: 'POS Troubleshooting Guide',
    targetCode: 'TG-201',
    details: 'Updated error codes section',
    timestamp: '45 minutes ago',
    ipAddress: '192.168.1.32',
  },
  {
    id: 3,
    user: 'Hassan Mostafa',
    userInitials: 'HM',
    userColor: 'bg-orange-100 text-orange-700',
    action: 'create',
    target: 'POS Not Powering On',
    targetCode: 'OC-301',
    details: 'Created new operational case',
    timestamp: '2 hours ago',
    ipAddress: '192.168.1.28',
  },
  {
    id: 4,
    user: 'Youssef Hussein',
    userInitials: 'YH',
    userColor: 'bg-blue-100 text-blue-700',
    action: 'reject',
    target: 'Barcode Scanner Configuration SOP',
    targetCode: 'SOP-104',
    details: 'Rejected due to incomplete testing procedures',
    timestamp: '4 hours ago',
    ipAddress: '192.168.1.50',
  },
  {
    id: 5,
    user: 'Karim Mahmoud',
    userInitials: 'KM',
    userColor: 'bg-purple-100 text-purple-700',
    action: 'download',
    target: 'Receipt Printer Troubleshooting Guide',
    targetCode: 'TG-202',
    details: 'Downloaded document for offline reference',
    timestamp: '6 hours ago',
    ipAddress: '192.168.1.41',
  },
  {
    id: 6,
    user: 'Omar Khaled',
    userInitials: 'OK',
    userColor: 'bg-indigo-100 text-indigo-700',
    action: 'view',
    target: 'Device Maintenance Guidelines',
    targetCode: 'ORG-102',
    details: 'Viewed document details',
    timestamp: '8 hours ago',
    ipAddress: '192.168.1.37',
  },
  {
    id: 7,
    user: 'Adam Ahmed',
    userInitials: 'AA',
    userColor: 'bg-indigo-100 text-indigo-700',
    action: 'edit',
    target: 'Receipt Printer Setup SOP',
    targetCode: 'SOP-103',
    details: 'Updated driver installation steps',
    timestamp: '1 day ago',
    ipAddress: '192.168.1.45',
  },
  {
    id: 8,
    user: 'Nour El-Din',
    userInitials: 'NE',
    userColor: 'bg-pink-100 text-pink-700',
    action: 'create',
    target: 'Monitor Troubleshooting Guide',
    targetCode: 'TG-205',
    details: 'Created new technical document',
    timestamp: '1 day ago',
    ipAddress: '192.168.1.32',
  },
]

export function ActivityLogs() {
  const [search, setSearch] = useState('')
  const [activeAction, setActiveAction] = useState<ActionType | 'All'>('All')
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Last 7 Days' | 'Last 30 Days'>('All')

  const filteredLogs = mockActivityLogs.filter(log => {
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.targetCode.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    
    const matchAction = activeAction === 'All' || log.action === activeAction
    
    return matchSearch && matchAction
  })

  return (
    <div className="space-y-5">
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
            <span className="text-sm font-semibold text-slate-700">{mockActivityLogs.length} Total Activities</span>
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
              const actionConfig = ACTION_STYLES[log.action]
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
                        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${log.userColor}`}>
                          {log.userInitials}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{log.user}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${actionConfig.color}`}>
                          {actionConfig.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-1">
                        <span className="font-medium text-slate-900">{log.target}</span>
                        <span className="text-slate-400"> ({log.targetCode})</span>
                      </p>
                      
                      <p className="text-xs text-slate-500">{log.details}</p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <AlertCircle className="w-3 h-3" />
                          {log.ipAddress}
                        </div>
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
            Showing {filteredLogs.length} of {mockActivityLogs.length} activities
          </span>
          <button className="text-xs text-blue-600 hover:underline font-medium">
            Export Logs
          </button>
        </div>
      </div>
    </div>
  )
}
