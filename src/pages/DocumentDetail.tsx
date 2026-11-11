import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocumentById, restoreDocumentVersion } from '../services/documents'
import { submitForApproval } from '../services/approvals'
import { findPendingRevision } from '../services/revisions'
import { getDevicesForDocument, isDevicesSchemaMissing } from '../services/devices'
import { logActivity } from '../services/activityLogs'
import { getSignedAttachmentUrl } from '../lib/attachments'
import {
  ATTACHMENTS_UNAVAILABLE_MESSAGE,
  isAttachmentsSchemaMissing,
  listDocumentAttachments,
  legacyAttachments,
  selectDocumentAttachments,
} from '../services/attachments'
import { CATEGORY_STYLES, DEVICES_UNAVAILABLE_MESSAGE } from '../lib/devices'
import { PERMISSIONS } from '../lib/permissions'
import type { Device, DocStatus, DocumentAttachment } from '../types/database'
import { useAuth } from '../contexts/AuthContext'
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
  Activity,
  Loader2,
  Plus,
  Send,
  HardDrive,
  History,
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
  const { user, can } = useAuth()
  const [doc, setDoc] = useState<any>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [devicesUnavailable, setDevicesUnavailable] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [attachmentIds, setAttachmentIds] = useState<DocumentAttachment[] | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [attachmentsUnavailable, setAttachmentsUnavailable] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; version: string } | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null)

  // Reads the links separately so a devices failure never hides the document.
  const loadLinkedDevices = async () => {
    if (!id) return
    try {
      setDevices(await getDevicesForDocument(id))
      setDevicesError(null)
      setDevicesUnavailable(false)
    } catch (err) {
      console.error('Failed to load linked devices:', err)
      if (isDevicesSchemaMissing(err)) setDevicesUnavailable(true)
      else setDevicesError('Linked devices could not be loaded: ' + (err as Error).message)
    }
  }

  // The registry, not document text, decides what may be downloaded. A failed
  // read is reported instead of being shown as a document with no files.
  const loadAttachments = async (documentId: string) => {
    try {
      const rows = await listDocumentAttachments(documentId)
      setAttachmentIds(rows)
      setAttachmentError(null)
      setAttachmentsUnavailable(false)
    } catch (err) {
      console.error('Failed to load attachments:', err)
      setAttachmentIds(null)
      if (isAttachmentsSchemaMissing(err)) setAttachmentsUnavailable(true)
      else setAttachmentError('Attachments could not be loaded: ' + (err as Error).message)
    }
  }

  useEffect(() => {
    async function loadDocument() {
      try {
        if (!id) return
        const documentData = await getDocumentById(id)
        setDoc(documentData)
        await Promise.all([loadLinkedDevices(), loadAttachments(id)])
      } catch (err) {
        setError('Failed to load document: ' + (err as Error).message)
        console.error('Error loading document:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDocument()
  }, [id])

  const handleSubmitForApproval = async () => {
    if (!doc || !user) return
    try {
      setSubmitting(true)
      setSubmitError(null)
      const result = await submitForApproval(doc.id, user.id)
      if (result.notificationWarning) {
        console.warn('[DocumentDetail]', result.notificationWarning)
      }
      await logActivity({
        user_id: user.id,
        action: 'edit',
        target_type: 'document',
        target_id: doc.id,
        target_title: doc.title,
        target_code: doc.code,
        details: `Submitted for approval: ${doc.title}`,
      })
      const updated = await getDocumentById(doc.id)
      setDoc(updated)
    } catch (err) {
      console.error('Failed to submit for approval:', err)
      setSubmitError('Failed to submit for approval: ' + (err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // Bringing a version back copies it forward as a new revision; no history row
  // is edited and no stored file is re-uploaded.
  const handleRestoreVersion = async () => {
    if (!doc || !user || !restoreTarget) return
    try {
      setRestoring(true)
      setRestoreError(null)
      const sourceVersion = restoreTarget.version
      const result = await restoreDocumentVersion(doc.id, restoreTarget.id)
      await logActivity({
        user_id: user.id,
        action: 'edit',
        target_type: 'document',
        target_id: doc.id,
        target_title: doc.title,
        target_code: doc.code,
        details: `Restored ${sourceVersion} as ${result.version}${result.staged ? ' (awaiting approval)' : ''}`,
      })
      const message = result.staged
        ? `Version ${result.version} was proposed from ${sourceVersion} and is awaiting approval. What is published now is unchanged.`
        : `Version ${result.version} was restored from ${sourceVersion}.`
      setRestoreNotice(result.notice ? `${message} ${result.notice}` : message)
      setRestoreTarget(null)
      setDoc(await getDocumentById(doc.id))
      await loadAttachments(doc.id)
    } catch (err) {
      console.error('Failed to restore version:', err)
      setRestoreError('Failed to restore this version: ' + (err as Error).message)
    } finally {
      setRestoring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading document...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-red-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Document</h2>
        <p className="text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/documents')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Documents
        </button>
      </div>
    )
  }

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

  const statusKey = doc.status as DocStatus
  const StatusIcon = STATUS_ICONS[statusKey]
  // Before the registry migration the markers are still worth showing, but only
  // when the read failed as "table missing" rather than as a real error.
  const currentVersion = (doc.versions || []).find((v: any) => v.version === doc.version)
  const attachments = attachmentIds
    ? selectDocumentAttachments(attachmentIds, currentVersion?.id ?? null)
    : attachmentsUnavailable && !attachmentError
      ? legacyAttachments(doc.content)
      : []

  const pendingRevision = findPendingRevision(
    doc.versions as Array<{ id: string; version: string; status?: string | null }> | undefined,
    doc.version
  )

  // Same rule the database uses for device links: managers always, agents only their own drafts.
  const canLinkDevices = can(PERMISSIONS.LINK_DEVICES)
    && (can(PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS)
        || (doc.owner_id === user?.id && doc.status !== 'Approved'))

  // Restoring is authoring, so it follows the same reach. One pending revision at
  // a time is the workflow rule, so the button waits while one is open.
  const canRestore = can(PERMISSIONS.CREATE_VERSION)
    && (can(PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS)
        || (doc.owner_id === user?.id && doc.status !== 'Approved'))

  // A fresh tab keeps the document open; noopener keeps the new tab from
  // reaching back into this window.
  const handleAttachmentDownload = async (path: string) => {
    try {
      const url = await getSignedAttachmentUrl(path)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) alert('Your browser blocked the download tab. Allow pop-ups for this site and try again.')
    } catch (err) {
      console.error('Failed to open attachment:', err)
      alert('This file is no longer available for download.')
    }
  }

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
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLES[statusKey]}`}>
                <StatusIcon className="w-3 h-3" />
                {doc.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{doc.code} · {doc.type} · Version {doc.version}</p>
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
          {(doc.status === 'Draft' || doc.status === 'Rejected') && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Submit for Review
            </button>
          )}
          <button onClick={() => {
            if (!doc) return
            const content = `${doc.title}\n${doc.code}\n\nDescription:\n${doc.description || ''}\n\nContent:\n${doc.content || ''}\n\nVersion: ${doc.version}\nStatus: ${doc.status}\nOwner: ${doc.users?.name || 'Unknown'}\nCreated: ${new Date(doc.created_at).toLocaleDateString()}\nUpdated: ${new Date(doc.updated_at).toLocaleDateString()}`
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${doc.code.replace(/\s+/g, '_')}_${doc.version}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Could not copy link'))
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{submitError}</p>
          <p className="text-xs text-red-600 mt-1">The document is unchanged and still on this page.</p>
        </div>
      )}

      {restoreError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{restoreError}</p>
          <p className="text-xs text-red-600 mt-1">Nothing was restored: no version was added and no file was moved.</p>
        </div>
      )}

      {restoreNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <p className="text-sm text-blue-800">{restoreNotice}</p>
          <button
            onClick={() => setRestoreNotice(null)}
            className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRestoreTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restore version {restoreTarget.version}?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Its text, metadata and files are copied forward as a new version. {restoreTarget.version} itself
                  stays exactly as it is, and nothing is deleted.
                  {doc.status === 'Approved' && ' The published document only changes once an approving reviewer accepts the new version.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRestoreTarget(null)}
                disabled={restoring}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreVersion}
                disabled={restoring}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                {restoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {restoring ? 'Restoring...' : 'Restore version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {attachmentsUnavailable && !attachmentError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">{ATTACHMENTS_UNAVAILABLE_MESSAGE}</p>
        </div>
      )}

      {attachmentError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{attachmentError}</p>
          <button
            onClick={() => id && loadAttachments(id)}
            className="mt-2 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

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
                    <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${doc.users?.avatar_color || 'bg-slate-100 text-slate-600'}`}>
                      {doc.users?.initials || doc.users?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </div>
                    <p className="text-sm font-medium text-slate-900">{doc.users?.name || 'Unknown'}</p>
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
                  <p className="text-sm font-medium text-slate-900">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Last Updated</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(doc.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase">Tags</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((tag: string) => (
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

          {/* linked devices */}
          {devicesError && (
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">Linked Devices</h2>
                  <p className="text-xs text-red-700">{devicesError}</p>
                </div>
                <button
                  onClick={loadLinkedDevices}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {devicesUnavailable && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-amber-900 mb-1">Linked Devices</h2>
              <p className="text-xs text-amber-700">{DEVICES_UNAVAILABLE_MESSAGE}</p>
            </div>
          )}

          {devices.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Linked Devices</h2>
                {canLinkDevices && (
                  <button
                    onClick={() => navigate(`/documents/${doc.id}/edit`)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Edit links
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {devices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="flex items-center gap-2 px-2.5 py-1.5 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 rounded-lg transition-colors"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[12px] font-medium text-slate-700">{device.name}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_STYLES[device.category]}`}>
                      {device.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* content */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {doc.content}
              </pre>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                  Current document attachments
                </p>
                <p className="text-[11px] text-slate-400 mb-2">
                  Files attached to the version you are viewing now. Older revisions keep their own files on their version pages.
                </p>
                <div className="space-y-1.5">
                  {attachments.map(a => (
                    <div key={a.path} className="flex items-center gap-2">
                      <button
                        onClick={() => handleAttachmentDownload(a.path)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {a.fileName}
                      </button>
                      {a.scope && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                          {a.scope === 'document' ? 'This document' : `From ${doc.version}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          {/* version history */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Version History</h2>
              <button
                onClick={() => navigate(`/documents/${doc.id}/edit?newVersion=1`)}
                disabled={!!pendingRevision}
                title={pendingRevision ? `Revision ${pendingRevision.version} is awaiting approval` : undefined}
                className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Version
              </button>
            </div>
            {pendingRevision && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-900">
                  Revision {pendingRevision.version} awaiting approval
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Users still see {doc.version}. One pending revision at a time.
                </p>
              </div>
            )}
            <div className="space-y-3">
              {doc.versions && doc.versions.length > 0 ? (
                doc.versions.map((v: unknown, _index: number) => {
                  const version = v as { id: string; version: string; created_at: string; author_id: string; notes: string; content?: string | null; status?: string | null; users?: { name: string; initials: string; avatar_color: string } }
                  const isCurrentVersion = version.version === doc.version
                  return (
                    <div key={version.id} className={`flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 ${isCurrentVersion ? 'bg-blue-50/50 -mx-2 px-2 rounded' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrentVersion ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        <GitBranch className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            {version.version}
                            {isCurrentVersion && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-600 text-white rounded">Current</span>}
                            {version.status === 'In Review' && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-500 text-white rounded">Awaiting approval</span>}
                          </p>
                          <p className="text-xs text-slate-400">{new Date(version.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{version.notes || 'No notes'}</p>
                        <p className="text-xs text-slate-400">Created by {version.author_id === user?.id ? 'you' : (version.users?.name || version.author_id?.slice(0, 8) || 'unknown')}</p>
                        <button
                          onClick={() => navigate(`/documents/${doc.id}/versions/${version.id}`)}
                          className="mt-1 text-xs text-blue-600 hover:underline"
                        >
                          Open version
                        </button>
                        {canRestore && !isCurrentVersion && (
                          <button
                            onClick={() => {
                              setRestoreError(null)
                              setRestoreTarget({ id: version.id, version: version.version })
                            }}
                            disabled={!!pendingRevision}
                            title={pendingRevision ? `Revision ${pendingRevision.version} is awaiting approval` : `Copy ${version.version} forward as a new version`}
                            className="mt-1 ml-3 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <History className="w-3 h-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No version history yet</p>
              )}
            </div>
          </div>

          {/* approval chain */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Approval Chain</h2>
            <div className="space-y-3">
              {doc.approvals && doc.approvals.length > 0 ? (
                doc.approvals.map((a: any) => {
                  const isApproved = a.status === 'Approved'
                  const isPending = a.status === 'Pending'
                  const isRejected = a.status === 'Rejected'
                  const isNotStarted = a.status === 'Not Started'

                  return (
                    <div key={a.id} className="flex items-start gap-3">
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
                      <p className="text-xs text-slate-600">Approval step</p>
                      {a.date && <p className="text-xs text-slate-400">{new Date(a.date).toLocaleDateString()}</p>}
                      {a.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{a.notes}"</p>
                      )}
                    </div>
                  </div>
                )
              })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No approval chain yet</p>
              )}
            </div>
          </div>

          {/* quick actions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/activity-logs')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                View Activity Log
              </button>
              <button
                onClick={() => {
                  if (!doc) return
                  const content = `${doc.title}\n${doc.code}\nVersion: ${doc.version}\nStatus: ${doc.status}\n\nDescription:\n${doc.description || ''}\n\nContent:\n${doc.content || ''}`
                  const blob = new Blob([content], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${doc.code.replace(/\s+/g, '_')}_${doc.version}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export as Text
              </button>
              <button
                onClick={() => navigate(`/documents/${doc.id}/edit?newVersion=1`)}
                disabled={!!pendingRevision}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Revised Version
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
