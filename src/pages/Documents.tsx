import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockDocuments, DocType, DocStatus } from '@/data/documents'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  BookOpen,
  Briefcase,
  Building2,
} from 'lucide-react'

const DOC_TYPE_CONFIG: { label: string; value: DocType | 'All'; icon: React.ElementType; color: string }[] = [
  { label: 'All Types', value: 'All', icon: FileText, color: 'text-slate-500' },
  { label: 'SOP', value: 'SOP', icon: FileCheck, color: 'text-blue-600' },
  { label: 'Technical Document', value: 'Technical Document', icon: BookOpen, color: 'text-teal-600' },
  { label: 'Operational Case', value: 'Operational Case', icon: Briefcase, color: 'text-orange-500' },
  { label: 'Org Info', value: 'Org Info', icon: Building2, color: 'text-slate-500' },
]

const STATUS_STYLES: Record<DocStatus, string> = {
  Approved: 'bg-green-100 text-green-700',
  'In Review': 'bg-amber-100 text-amber-700',
  Draft: 'bg-slate-100 text-slate-600',
  Rejected: 'bg-red-100 text-red-600',
}

const STATUS_ICONS: Record<DocStatus, React.ElementType> = {
  Approved: CheckCircle,
  'In Review': Clock,
  Draft: FileText,
  Rejected: AlertCircle,
}

const TYPE_STYLES: Record<DocType, string> = {
  SOP: 'bg-blue-100 text-blue-700',
  'Technical Document': 'bg-teal-100 text-teal-700',
  'Operational Case': 'bg-orange-100 text-orange-700',
  'Org Info': 'bg-slate-100 text-slate-600',
}

function ActionsMenu({ docId, onClose }: { docId: number; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-44" onClick={onClose}>
      <button
        onClick={() => navigate(`/documents/${docId}`)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        View Document
      </button>
      <button
        onClick={() => navigate(`/documents/${docId}/edit`)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
      <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Download
      </button>
      <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  )
}

export function Documents() {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState<DocType | 'All'>('All')
  const [activeStatus, setActiveStatus] = useState<DocStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  const filtered = mockDocuments.filter(doc => {
    const matchType = activeType === 'All' || doc.type === activeType
    const matchStatus = activeStatus === 'All' || doc.status === activeStatus
    const matchSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.code.toLowerCase().includes(search.toLowerCase()) ||
      doc.owner.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  return (
    <div className="space-y-5" onClick={() => setOpenMenu(null)}>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {mockDocuments.length} documents · SOPs, Technical Documents, Operational Cases & Org Info
          </p>
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            navigate('/documents/create')
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Document
        </button>
      </div>

      {/* type filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DOC_TYPE_CONFIG.map(({ label, value, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setActiveType(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeType === value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeType === value ? 'text-white' : color}`} />
            {label}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                activeType === value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {value === 'All'
                ? mockDocuments.length
                : mockDocuments.filter(d => d.type === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* search + status filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search POS, printer, scanner documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
          />
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['All', 'Approved', 'In Review', 'Draft', 'Rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                activeStatus === s ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Document
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Version
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">
                  Owner
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">
                  Last Updated
                </th>
                <th className="py-3 px-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">No documents found</p>
                    <p className="text-xs text-slate-300 mt-1">Try adjusting your filters or search term</p>
                  </td>
                </tr>
              ) : (
                filtered.map(doc => {
                  const StatusIcon = STATUS_ICONS[doc.status]
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doc.code} · {doc.description.slice(0, 55)}…
                        </p>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${TYPE_STYLES[doc.type]}`}>
                          {doc.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-xs font-medium text-slate-600">{doc.version}</td>

                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${doc.ownerColor}`}
                          >
                            {doc.ownerInitials}
                          </div>
                          <span className="text-xs text-slate-600">{doc.owner}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded ${STATUS_STYLES[doc.status]}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {doc.status}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-slate-400 hidden lg:table-cell">{doc.updatedAt}</td>

                      <td className="py-3.5 px-3 relative">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setOpenMenu(openMenu === doc.id ? null : doc.id)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenu === doc.id && <ActionsMenu docId={doc.id} onClose={() => setOpenMenu(null)} />}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Showing {filtered.length} of {mockDocuments.length} documents
          </span>
          <div className="flex items-center gap-1">
            {(['Approved', 'In Review', 'Draft', 'Rejected'] as DocStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1 ml-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    s === 'Approved'
                      ? 'bg-green-500'
                      : s === 'In Review'
                      ? 'bg-amber-500'
                      : s === 'Draft'
                      ? 'bg-slate-400'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-[11px] text-slate-400">
                  {mockDocuments.filter(d => d.status === s).length} {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
