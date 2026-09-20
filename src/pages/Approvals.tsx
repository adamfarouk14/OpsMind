import { useState } from 'react'
import { mockDocuments } from '../data/documents'
import type { DocStatus } from '../data/documents'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  Eye,
  MoreHorizontal,
  AlertCircle,
  Calendar,
  User,
  Send,
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
  Rejected: XCircle,
}

export function Approvals() {
  const [activeStatus, setActiveStatus] = useState<'All' | 'In Review' | 'Approved' | 'Rejected'>('In Review')
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null)
  const [remarks, setRemarks] = useState('')
  const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | null>(null)

  const pendingDocs = mockDocuments.filter(doc => doc.status === 'In Review')
  const approvedDocs = mockDocuments.filter(doc => doc.status === 'Approved')
  const rejectedDocs = mockDocuments.filter(doc => doc.status === 'Rejected')

  const filteredDocs = activeStatus === 'All' 
    ? mockDocuments 
    : mockDocuments.filter(doc => doc.status === activeStatus)

  const handleApprove = () => {
    console.log('Approving document:', selectedDoc, 'Remarks:', remarks)
    setShowActionModal(null)
    setRemarks('')
    setSelectedDoc(null)
  }

  const handleReject = () => {
    console.log('Rejecting document:', selectedDoc, 'Remarks:', remarks)
    setShowActionModal(null)
    setRemarks('')
    setSelectedDoc(null)
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and approve or reject pending documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{pendingDocs.length} Pending</span>
          </div>
        </div>
      </div>

      {/* status filter tabs */}
      <div className="flex items-center gap-1.5">
        {(['All', 'In Review', 'Approved', 'Rejected'] as const).map(status => {
          const count = status === 'All' 
            ? mockDocuments.length 
            : status === 'In Review' 
            ? pendingDocs.length 
            : status === 'Approved' 
            ? approvedDocs.length 
            : rejectedDocs.length
          
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                activeStatus === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* documents list */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">No documents found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting the status filter</p>
          </div>
        ) : (
          filteredDocs.map(doc => {
            const StatusIcon = STATUS_ICONS[doc.status]
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  {/* document info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">{doc.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${STATUS_STYLES[doc.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{doc.code} · {doc.type}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{doc.description}</p>
                    
                    {/* metadata */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{doc.owner}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{doc.updatedAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{doc.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  {doc.status === 'In Review' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc.id)
                          setShowActionModal('approve')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc.id)
                          setShowActionModal('reject')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {doc.status !== 'In Review' && (
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* approval chain preview */}
                {doc.approvalChain && doc.approvalChain.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Approval Chain</span>
                      <div className="flex-1 flex items-center gap-1">
                        {doc.approvalChain.map((step, i) => {
                          const isApproved = step.status === 'Approved'
                          const isPending = step.status === 'Pending'
                          const isRejected = step.status === 'Rejected'
                          
                          return (
                            <div key={i} className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isApproved ? 'bg-green-500' : isPending ? 'bg-amber-500' : isRejected ? 'bg-red-500' : 'bg-slate-300'
                                }`}
                              />
                              <span className="text-xs text-slate-500 truncate max-w-24">{step.step}</span>
                              {i < doc.approvalChain.length - 1 && (
                                <ChevronDown className="w-3 h-3 text-slate-300" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* action modal */}
      {showActionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowActionModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                showActionModal === 'approve' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {showActionModal === 'approve' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {showActionModal === 'approve' ? 'Approve Document' : 'Reject Document'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {showActionModal === 'approve' 
                    ? 'This document will be marked as approved and available for use.' 
                    : 'This document will be rejected and returned to the author for revisions.'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remarks (optional)
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add any comments or feedback..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowActionModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showActionModal === 'approve' ? handleApprove : handleReject}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  showActionModal === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showActionModal === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
