import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, 
  Clock, 
  FolderKanban, 
  GitBranch,
  FilePlus,
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  Plus,
  ChevronRight,
  RefreshCw,
  Filter,
  ArrowRight,
  Zap,
  Loader2
} from 'lucide-react'
import { getDocuments } from '../services/documents'
import { getPendingApprovals } from '../services/approvals'
import { getActivityLogs } from '../services/activityLogs'
import { supabase } from '../lib/supabase'




// chart data will be generated from live activity logs inside the component





// quick actions
const quickActions = [
  {
    name: 'Create SOP',
    desc: 'Standard operating procedure template',
    icon: FilePlus,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    href: '/documents/create',
  },
  {
    name: 'New Technical Document',
    desc: 'Architecture, setup, troubleshooting',
    icon: FileText,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    href: '/documents/create',
  },
  {
    name: 'Log Operational Case',
    desc: 'Resolution path for device issue',
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    href: '/documents/create',
  },
  {
    name: 'Browse Documents',
    desc: 'View all knowledge base documents',
    icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    href: '/documents',
  },
]

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [allLogs, setAllLogs] = useState<any[]>([])
  const [revisionCount, setRevisionCount] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const [docs, approvals, logs, allLogsData, versionsResult] = await Promise.all([
          getDocuments(),
          getPendingApprovals(),
          getActivityLogs(5),
          getActivityLogs(500),
          supabase.from('document_versions').select('id', { count: 'exact', head: true }),
        ])
        setDocuments(docs)
        setPendingApprovals(approvals)
        setActivityLogs(logs)
        setAllLogs(allLogsData)
        setRevisionCount(versionsResult.count || 0)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Live chart data from activity logs (last 8 weeks)
  const chartData = (() => {
    const weeks = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - 6)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)
      weekEnd.setHours(23, 59, 59, 999)
      const inWeek = allLogs.filter(l => {
        const d = new Date(l.created_at)
        return d >= weekStart && d <= weekEnd
      })
      weeks.push({
        week: i === 0 ? 'This Week' : `Week ${8 - i}`,
        created: inWeek.filter(l => l.action === 'create').length,
        updated: inWeek.filter(l => l.action === 'edit').length,
      })
    }
    return weeks
  })()

  const maxVal = Math.max(...chartData.flatMap(d => [d.created, d.updated]), 1)

  const metrics = [
    {
      title: 'TOTAL DOCUMENTS',
      value: documents.length.toString(),
      badge: `${documents.length} documents in system`,
      badgeColor: 'text-green-600 bg-green-50',
      sub: [
        `${documents.filter(d => d.type === 'SOP').length} SOPs`,
        `${documents.filter(d => d.type === 'Technical Document').length} Tech Docs`,
        `${documents.filter(d => d.type === 'Operational Case').length} Cases`,
      ],
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      accent: 'border-t-blue-500',
    },
    {
      title: 'PENDING APPROVALS',
      value: pendingApprovals.length.toString(),
      badge: null,
      sub: pendingApprovals.slice(0, 2).map(d => d.title),
      icon: Clock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'border-t-orange-500',
      subBadges: pendingApprovals.slice(0, 2).map(d => ({
        label: d.code,
        color: 'bg-orange-100 text-orange-700',
      })),
    },
    {
      title: 'DOCUMENTS BY TYPE',
      value: '4 Types',
      badge: null,
      sub: [
        `${documents.filter(d => d.type === 'SOP').length} SOPs`,
        `${documents.filter(d => d.type === 'Technical Document').length} Tech Docs`,
        `${documents.filter(d => d.type === 'Org Info').length} Org Docs`,
      ],
      icon: FolderKanban,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      accent: 'border-t-teal-500',
      bar: [
        { label: 'SOPs', pct: documents.length > 0 ? Math.round((documents.filter(d => d.type === 'SOP').length / documents.length) * 100) : 0, color: 'bg-blue-500' },
        { label: 'Tech', pct: documents.length > 0 ? Math.round((documents.filter(d => d.type === 'Technical Document').length / documents.length) * 100) : 0, color: 'bg-teal-500' },
        { label: 'Org', pct: documents.length > 0 ? Math.round((documents.filter(d => d.type === 'Org Info').length / documents.length) * 100) : 0, color: 'bg-slate-300' },
        { label: 'Other', pct: documents.length > 0 ? Math.round((documents.filter(d => d.type === 'Operational Case').length / documents.length) * 100) : 0, color: 'bg-purple-400' },
      ],
    },
    {
      title: 'DOCUMENT REVISIONS',
      value: revisionCount.toString(),
      badge: revisionCount > 0 ? `${revisionCount} version records` : 'No revisions yet',
      badgeColor: 'text-green-600 bg-green-50',
      sub: ['Across all support', 'teams', 'version history'],
      icon: GitBranch,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      accent: 'border-t-purple-500',
      published: 'total revisions',
    },
  ]

  const recentActivity = activityLogs.map(log => ({
    id: log.id,
    user: log.users?.name || 'Unknown',
    action: log.action,
    doc: log.target_title || log.target_code || '',
    time: new Date(log.created_at).toLocaleString(),
    dot: 'bg-blue-500',
    initials: log.users?.initials || 'U',
    avatarBg: log.users?.avatar_color || 'bg-slate-100 text-slate-600',
  }))

  const recentDocuments = documents.slice(0, 4).map(doc => ({
    id: doc.id,
    title: doc.title,
    code: `${doc.code} • ${doc.description?.slice(0, 30) || ''}`,
    type: doc.type,
    typeColor: doc.type === 'SOP' ? 'bg-blue-100 text-blue-700' :
                 doc.type === 'Technical Document' ? 'bg-teal-100 text-teal-700' :
                 doc.type === 'Operational Case' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600',
    version: doc.version,
    owner: doc.users?.name || 'Unknown',
    ownerBg: doc.users?.avatar_color || 'bg-slate-100 text-slate-600',
    status: doc.status,
    statusColor: doc.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  doc.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                  doc.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700',
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">



      {/* welcome + top ctas */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back, {user?.name || 'there'}</h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[13px] text-slate-500">
            <button className="text-blue-600 hover:underline font-medium">Technical Support Knowledge Base</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button className="text-blue-600 hover:underline font-medium">POS & Device Support Resources</button>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">{documents.length} Active Documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/search')} className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Search className="w-3.5 h-3.5" />
            Search Knowledge
          </button>
          <button onClick={() => navigate('/ai-knowledge')} className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Ask AI
          </button>
          <button onClick={() => navigate('/documents/create')} className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Document
          </button>
        </div>
      </div>





      {/* metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.title} className={`bg-white rounded-xl border border-slate-200 border-t-4 ${m.accent} p-4 hover:shadow-sm transition-shadow`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{m.title}</p>
                <div className={`w-8 h-8 rounded-lg ${m.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 leading-none mb-2">{m.value}</p>




              {/* show sub-badges for the pending approvals card */}
              {m.subBadges && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {m.subBadges.map(b => (
                    <span key={b.label} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${b.color}`}>{b.label}</span>
                  ))}
                </div>
              )}





              {/* stacked bar for the doc types card */}
              {m.bar && (
                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-2">
                  {m.bar.map(b => (
                    <div key={b.label} className={`${b.color} h-full`} style={{ width: `${b.pct}%` }} />
                  ))}
                </div>
              )}



              {/* plain text breakdown for the other cards */}
              {!m.subBadges && !m.bar && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {m.sub.join(' · ')}
                </p>
              )}

              {m.badge && (
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 ${m.badgeColor}`}>{m.badge}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* chart + quick actions + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">Knowledge Base Activity &amp; Overview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Documents created vs. documents updated over time</p>
            </div>
            <div className="flex items-center gap-1">
              {['30D','90D','1Y'].map(t => (
                <button
                  key={t}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                    t === '30D'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>



          {/* chart */}
          <div className="mt-4 flex items-end gap-2 h-44 px-1">
            {chartData.map((d, i) => {
              const createdH = Math.round((d.created / maxVal) * 160)
              const updatedH = Math.round((d.updated / maxVal) * 160)
              const isCurrent = i === chartData.length - 1
              return (
                <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 w-full justify-center">
                    <div
                      className={`w-[42%] rounded-t-sm transition-all ${isCurrent ? 'bg-blue-600' : 'bg-blue-300'}`}
                      style={{ height: createdH }}
                    />
                    <div
                      className={`w-[42%] rounded-t-sm transition-all ${isCurrent ? 'bg-blue-400' : 'bg-blue-200'}`}
                      style={{ height: updatedH }}
                    />
                  </div>
                  <span className={`text-[9px] text-center leading-tight ${isCurrent ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                    {d.week.replace(' (Current)', '')}
                  </span>
                </div>
              )
            })}
          </div>



          {/* legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-blue-500" />
              <span className="text-[11px] text-slate-500">Documents Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-blue-200" />
              <span className="text-[11px] text-slate-500">Documents Updated / Revised</span>
            </div>
            <span className="ml-auto text-[11px] text-slate-400">Showing activity over past 8 weeks</span>
          </div>
        </div>



        {/* quick actions panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-slate-800">Quick Actions</h2>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-2 flex-1">
            {quickActions.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.name}
                  onClick={() => navigate(a.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${a.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 leading-tight">{a.name}</p>
                    <p className="text-[11px] text-slate-400 leading-tight truncate">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      </div>



      {/* documents table + activity log */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* documents table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200">
          {/* tabs */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0 border-b border-slate-100">
            <div className="flex gap-1">
              {['Recently Added Documents', 'Recently Updated Documents'].map((tab, i) => (
                <button
                  key={tab}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-px ${
                    i === 0
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {i === 0 ? <RefreshCw className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pb-2">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400">Showing {recentDocuments.length} of {documents.length} documents</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Document Title &amp; Code</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Document Type</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">VER</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Owner / Author</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} onClick={() => navigate(`/documents/${doc.id}`)} className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer group">
                    <td className="py-3 px-5">
                      <p className="text-[13px] font-semibold text-blue-600 group-hover:underline leading-tight">{doc.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{doc.code}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded ${doc.typeColor}`}>{doc.type}</span>
                    </td>
                    <td className="py-3 px-3 text-[12px] text-slate-600 font-medium">{doc.version}</td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${doc.ownerBg}`}>
                          {doc.owner.split(' ').map(p => p[0]).join('')}
                        </div>
                        <span className="text-[12px] text-slate-600">{doc.owner}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded ${doc.statusColor}`}>{doc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Showing 1 to {recentDocuments.length} of {documents.length} entries</span>
            <button onClick={() => navigate('/documents')} className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline font-medium">
              Browse all documents <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>




        {/* recent activity log */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-slate-800">Recent Activity Log</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-50 text-green-600 rounded-full">Live updates</span>
          </div>

          <div className="flex-1 space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {/* dot */}
                <div className="relative flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${a.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-900">{a.user}</span>{' '}
                    {a.action}{' '}
                    <span className="text-blue-600 font-medium">{a.doc}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <button onClick={() => navigate('/activity-logs')} className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline font-medium">
              View full activity log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
