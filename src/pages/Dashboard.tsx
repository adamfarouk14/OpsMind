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
  Zap
} from 'lucide-react'

// metric cards
const metrics = [
  {
    title: 'TOTAL DOCUMENTS',
    value: '1,284',
    badge: '+38 added this month',
    badgeColor: 'text-green-600 bg-green-50',
    sub: ['432 SOPs', '528 Tech Docs', '254 Cases'],
    icon: FileText,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accent: 'border-t-blue-500',
  },
  {
    title: 'PENDING APPROVALS',
    value: '8',
    badge: null,
    sub: ['5 POS SOPs', '3 Device Guides', 'Awaiting supervisor…', 'Review queue'],
    icon: Clock,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    accent: 'border-t-orange-500',
    subBadges: [
      { label: '5 POS SOPs', color: 'bg-orange-100 text-orange-700' },
      { label: '3 Device Guides', color: 'bg-slate-100 text-slate-600' },
    ],
  },
  {
    title: 'DOCUMENTS BY TYPE',
    value: '4 Types',
    badge: null,
    sub: ['432 SOPs', '528 Tech Docs', '130 Org Docs'],
    icon: FolderKanban,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    accent: 'border-t-teal-500',
    bar: [
      { label: 'SOPs', pct: 34, color: 'bg-blue-500' },
      { label: 'Tech', pct: 41, color: 'bg-teal-500' },
      { label: 'Org', pct: 10, color: 'bg-slate-300' },
      { label: 'Other', pct: 15, color: 'bg-purple-400' },
    ],
  },
  {
    title: 'DOCUMENT REVISIONS',
    value: '96',
    badge: 'Active cadence',
    badgeColor: 'text-green-600 bg-green-50',
    sub: ['Across all support', 'teams', '100% current'],
    icon: GitBranch,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    accent: 'border-t-purple-500',
    published: 'published this month',
  },
]




// chart data (8 weeks)
const chartData = [
  { week: 'Week 1', created: 28, updated: 18 },
  { week: 'Week 2', created: 35, updated: 22 },
  { week: 'Week 3', created: 22, updated: 30 },
  { week: 'Week 4', created: 40, updated: 25 },
  { week: 'Week 5', created: 30, updated: 35 },
  { week: 'Week 6', created: 45, updated: 28 },
  { week: 'Week 7', created: 38, updated: 42 },
  { week: 'Week 8 (Current)', created: 55, updated: 48 },
]
const maxVal = Math.max(...chartData.flatMap(d => [d.created, d.updated]))





// quick actions
const quickActions = [
  {
    name: 'Create SOP',
    desc: 'Standard operating procedure template',
    icon: FilePlus,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    name: 'New Technical Document',
    desc: 'Architecture, setup, troubleshooting',
    icon: FileText,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    name: 'Log Operational Case',
    desc: 'Resolution path for device issue',
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    name: 'Submit for Approval',
    desc: 'Start document review workflow',
    icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
]




// recent activity
const recentActivity = [
  {
    id: 1,
    user: 'Adam Ahmed',
    action: 'approved',
    doc: 'SOP-102 (POS Troubleshooting SOP)',
    time: '15 minutes ago',
    dot: 'bg-green-500',
    initials: 'AA',
    avatarBg: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 2,
    user: 'Nour El-Din',
    action: 'submitted draft',
    doc: 'v1.6 of Receipt Printer Troubleshooting Guide',
    time: '45 minutes ago',
    dot: 'bg-blue-500',
    initials: 'NE',
    avatarBg: 'bg-pink-100 text-pink-700',
  },
  {
    id: 3,
    user: 'Hassan Mostafa',
    action: 'updated',
    doc: 'Operational Case 03-412 (POS Not Powering On)',
    time: '2 hours ago',
    dot: 'bg-orange-400',
    initials: 'HM',
    avatarBg: 'bg-orange-100 text-orange-700',
  },
  {
    id: 4,
    user: 'Youssef Hussein',
    action: 'updated access permissions for',
    doc: 'Device Maintenance Guidelines',
    time: '4 hours ago',
    dot: 'bg-blue-500',
    initials: 'YH',
    avatarBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: 5,
    user: 'Karim Mahmoud',
    action: 'published v2.0 of',
    doc: 'Windows Installation SOP',
    time: '6 hours ago',
    dot: 'bg-purple-500',
    initials: 'KM',
    avatarBg: 'bg-purple-100 text-purple-700',
  },
]



// documents table
const documents = [
  {
    id: 1,
    title: 'POS Troubleshooting SOP',
    code: 'SOP-102 • POS System Troubleshooting Procedures',
    type: 'SOP',
    typeColor: 'bg-blue-100 text-blue-700',
    version: 'v1.8',
    owner: 'A. Ahmed',
    ownerBg: 'bg-indigo-100 text-indigo-700',
    status: 'Approved',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 2,
    title: 'Receipt Printer Troubleshooting Guide',
    code: 'TG-202 • Printer Hardware & Software Issues',
    type: 'Technical Document',
    typeColor: 'bg-teal-100 text-teal-700',
    version: 'v1.6',
    owner: 'N. El-Din',
    ownerBg: 'bg-pink-100 text-pink-700',
    status: 'In Review',
    statusColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 3,
    title: 'POS Not Powering On',
    code: 'OC-301 • Device Hardware Failure Cases',
    type: 'Operational Case',
    typeColor: 'bg-orange-100 text-orange-700',
    version: 'v1.0',
    owner: 'H. Mostafa',
    ownerBg: 'bg-orange-100 text-orange-700',
    status: 'Approved',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 4,
    title: 'Device Maintenance Guidelines',
    code: 'ORG-102 • Hardware Maintenance & Care',
    type: 'Org Info',
    typeColor: 'bg-slate-100 text-slate-600',
    version: 'v1.5',
    owner: 'Y. Hussein',
    ownerBg: 'bg-blue-100 text-blue-700',
    status: 'Draft',
    statusColor: 'bg-slate-100 text-slate-600',
  },
]

export function Dashboard() {
  return (
    <div className="space-y-5">



      {/* welcome + top ctas */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back, Youssef Hussein</h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[13px] text-slate-500">
            <button className="text-blue-600 hover:underline font-medium">Technical Support Knowledge Base</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button className="text-blue-600 hover:underline font-medium">POS & Device Support Resources</button>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">1,284 Active Documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Search className="w-3.5 h-3.5" />
            Search Knowledge
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Ask AI
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors">
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
              <span className="text-[11px] text-slate-400">Showing 4 of 1,284 documents</span>
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer group">
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
            <span className="text-[11px] text-slate-400">Showing 1 to 4 of 1,284 entries</span>
            <button className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline font-medium">
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
            <button className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline font-medium">
              View full activity log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
