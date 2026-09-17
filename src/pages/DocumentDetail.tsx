import { useParams, useNavigate } from 'react-router-dom'
import { getDocumentById } from '@/data/documents'
import type { DocStatus } from '@/data/documents'
import {
  ArrowLeft,
  Pencil,
  Download,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Tag,
  GitBranch,
  CheckCircle2,
  XCircle,
  CircleDashed,
  MoreHorizontal,
} from 'lucide-react'

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

export function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const doc = getDocumentById(Number(id))

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Document Not Found</h2>
        <p className="text-slate-500 mb-4">The document you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/documents')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Documents
        </button>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[doc.status]

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{doc.title}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLES[doc.status]}`}>
                <StatusIcon className="w-3 h-3" />
                {doc.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{doc.code} · {doc.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/documents/${doc.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* document info card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Owner</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${doc.ownerColor}`}>
                      {doc.ownerInitials}
                    </div>
                    <p className="text-sm font-medium text-slate-900">{doc.owner}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Version</p>
                  <p className="text-sm font-semibold text-slate-900">{doc.version}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Created</p>
                  <p className="text-sm font-medium text-slate-900">{doc.createdAt}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Last Updated</p>
                  <p className="text-sm font-medium text-slate-900">{doc.updatedAt}</p>
                </div>
              </div>
            </div>

            {/* tags */}
            {doc.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase">Tags</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* description */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>
          </div>

          {/* content */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {doc.content}
              </pre>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          {/* version history */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Version History</h2>
            <div className="space-y-3">
              {doc.versions.map((v, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900">{v.version}</p>
                      <p className="text-xs text-slate-400">{v.date}</p>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{v.notes}</p>
                    <p className="text-xs text-slate-400">by {v.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* approval chain */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Approval Chain</h2>
            <div className="space-y-3">
              {doc.approvalChain.map((a, i) => {
                const isApproved = a.status === 'Approved'
                const isPending = a.status === 'Pending'
                const isRejected = a.status === 'Rejected'
                const isNotStarted = a.status === 'Not Started'

                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isApproved
                          ? 'bg-green-100 text-green-600'
                          : isPending
                          ? 'bg-amber-100 text-amber-600'
                          : isRejected
                          ? 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isPending && <Clock className="w-3.5 h-3.5" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5" />}
                      {isNotStarted && <CircleDashed className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 mb-0.5">{a.step}</p>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${a.approverColor}`}>
                          {a.approverInitials}
                        </div>
                        <p className="text-xs text-slate-600">{a.approver}</p>
                      </div>
                      {a.date && <p className="text-xs text-slate-400">{a.date}</p>}
                      {a.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{a.notes}"</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* quick actions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
                View Activity Log
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
                Export as PDF
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
                Create New Version
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
