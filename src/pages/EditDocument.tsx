import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import type { DocType } from '../types/database'
import { getDocumentById, updateDocument, createDocumentVersion } from '../services/documents'
import { findPendingRevision } from '../services/revisions'
import { getDevicesForDocument, syncDocumentDevices, isDevicesSchemaMissing } from '../services/devices'
import { nextVersionStamp } from '../lib/versions'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { DevicePicker } from '../components/DevicePicker'
import { DEVICES_UNAVAILABLE_MESSAGE } from '../lib/devices'
import {
  attachmentFileName,
  buildAttachmentPath,
  storeAttachment,
  storeAttachmentForRevision,
  validateAttachmentFile,
} from '../services/attachments'
import { PERMISSIONS } from '../lib/permissions'
import { ArrowLeft, Save, X, AlertCircle, ChevronDown, GitBranch, Loader2, Upload } from 'lucide-react'

export function EditDocument() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, can } = useAuth()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    code: '',
    type: 'SOP' as DocType,
    description: '',
    content: '',
    tags: '',
    versionNotes: '',
    category: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null)
  const [deviceIds, setDeviceIds] = useState<string[]>([])
  const [originalDeviceIds, setOriginalDeviceIds] = useState<string[]>([])
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [createNewVersion, setCreateNewVersion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linkWarning, setLinkWarning] = useState<string | null>(null)
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [devicesUnavailable, setDevicesUnavailable] = useState(false)
  const [pendingRevision, setPendingRevision] = useState<{ id: string; version: string } | null>(null)

  // Reads the stored links so a failed read is never shown as an empty list.
  const loadLinkedDevices = async () => {
    if (!id) return
    try {
      const linked = await getDevicesForDocument(id)
      const linkedIds = linked.map(device => device.id)
      setDeviceIds(linkedIds)
      setOriginalDeviceIds(linkedIds)
      setDevicesError(null)
      setDevicesUnavailable(false)
    } catch (err) {
      console.error('Failed to load linked devices:', err)
      if (isDevicesSchemaMissing(err)) setDevicesUnavailable(true)
      else setDevicesError('Linked devices could not be loaded: ' + (err as Error).message)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return
        const documentData = await getDocumentById(id)
        setDoc(documentData)
        setForm({
          title: documentData.title || '',
          code: documentData.code || '',
          type: documentData.type || 'SOP',
          description: documentData.description || '',
          content: documentData.content || '',
          tags: documentData.tags?.filter((t: string) => !t.startsWith('Category: ')).join(', ') || '',
          versionNotes: '',
          category: documentData.tags?.find((t: string) => t.startsWith('Category: '))?.replace('Category: ', '') || '',
        })
        if (new URLSearchParams(location.search).get('newVersion')) {
          // arrived from "New Version": edits here define the new revision
          setCreateNewVersion(true)
        }

        const pending = findPendingRevision(
          documentData.versions as Array<{ id: string; version: string; status?: string | null }>,
          documentData.version
        )
        setPendingRevision(pending ? { id: pending.id, version: pending.version } : null)

        // Links never block editing the document itself.
        await loadLinkedDevices()
      } catch (err) {
        setError('Failed to load document: ' + (err as Error).message)
        console.error('Error loading document:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const suggestedVersion = doc
    ? nextVersionStamp([
        doc.version,
        ...(doc.versions ?? []).map((v: { version: string }) => v.version),
      ])
    : 'v1.0'
  const targetVersion = suggestedVersion
  const mustRevise = doc?.status === 'Approved'

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
        <AlertCircle className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Document Not Found</h2>
        <p className="text-slate-500 mb-4">Cannot edit a document that doesn't exist.</p>
        <button
          onClick={() => navigate('/documents')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Documents
        </button>
      </div>
    )
  }

  // Mirrors the document_devices write policy: managers link anything, agents
  // only their own not-yet-published drafts. RLS still decides in the database.
  const canLink = can(PERMISSIONS.LINK_DEVICES)
    && (can(PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS)
        || (doc.owner_id === user?.id && doc.status !== 'Approved'))

  // Without a trustworthy read the selection may be wrong, so linking is off.
  const linksReadOk = !devicesError && !devicesUnavailable

  // Returns false when the links were refused, so the caller can stay on the
  // form and offer a retry instead of re-saving the whole document.
  const syncDevices = async (): Promise<boolean> => {
    try {
      await syncDocumentDevices(doc.id, deviceIds)
      setOriginalDeviceIds(deviceIds)
      setLinkWarning(null)
      return true
    } catch (err) {
      console.error('Failed to update device links:', err)
      setLinkWarning(`The document was saved, but its device links were not: ${(err as Error).message}`)
      return false
    }
  }

  const linksChanged = [...deviceIds].sort().join() !== [...originalDeviceIds].sort().join()

  const retryLinkDevices = async () => {
    if (!linksChanged) {
      navigate(`/documents/${doc.id}`)
      return
    }
    setSaving(true)
    const linked = await syncDevices()
    setSaving(false)
    if (linked) navigate(`/documents/${doc.id}`)
  }

  const handleSave = async () => {
    if (!doc || !user) {
      setSaveError('Cannot save: not authenticated')
      return
    }

    if (file && !can(PERMISSIONS.UPLOAD_DOCUMENTS)) {
      setFileError('Your role cannot attach files to documents.')
      return
    }

    if (createNewVersion && pendingRevision) {
      setSaveError(`Revision ${pendingRevision.version} is already awaiting approval. It must be approved or rejected before another revision can be saved.`)
      return
    }
    if (!createNewVersion && doc.status === 'Approved') {
      setSaveError('This document is already published. Tick “Create New Version” so your changes go through approval instead of replacing it silently.')
      return
    }

    try {
      setSaving(true)
      setSaveError(null)
      setAttachmentWarning(null)

      let tagsArray = form.tags.split(',').map(t => t.trim()).filter(t => t)
      if (form.type === 'Operational Case' && form.category.trim()) {
        tagsArray = tagsArray.filter(t => !t.startsWith('Category: '))
        tagsArray.unshift(`Category: ${form.category.trim()}`)
      }

      // One save path for both modes; it returns the new version id when a
      // revision is staged, because the attachment binds to that row.
      const saveRecord = async (content: string, filePath: string | null) => {
        if (createNewVersion) {
          const version = await createDocumentVersion(doc.id, {
            version: targetVersion,
            author_id: user.id,
            notes: form.versionNotes,
            title: form.title,
            description: form.description,
            content,
            type: form.type,
            status: 'In Review',
            tags: tagsArray,
            file_path: filePath,
            file_name: file && filePath ? attachmentFileName(file) : null,
          })
          return version?.id ?? null
        }
        await updateDocument(doc.id, {
          title: form.title,
          code: form.code,
          type: form.type,
          version: doc.version,
          description: form.description,
          content,
          tags: tagsArray,
        })
        return null
      }

      let notice: string | null = null

      if (file) {
        const invalid = validateAttachmentFile(file)
        if (invalid) {
          setFileError(invalid)
          return
        }
        const path = buildAttachmentPath(user.id, form.code, file.name)
        const contentWithFile = `${form.content}\n\n[Attached file: ${path}]`
        try {
          notice = createNewVersion
            ? await storeAttachmentForRevision(file, path, doc.id, () => saveRecord(contentWithFile, path))
            : await storeAttachment(file, path, { documentId: doc.id }, () => saveRecord(contentWithFile, path))
        } catch (err) {
          // Nothing was published: the document keeps its previous content.
          console.error('Failed to attach file:', err)
          setSaveError('Failed to save document: ' + (err as Error).message)
          return
        }
      } else {
        await saveRecord(form.content, null)
      }

      await logActivity({
        user_id: user.id,
        action: 'edit',
        target_type: 'document',
        target_id: doc.id,
        target_title: form.title,
        target_code: form.code,
        details: createNewVersion
          ? `Submitted ${targetVersion} for approval: ${form.versionNotes}`
          : `Edited document: ${form.title}`,
      })

      if (notice) setAttachmentWarning(notice)

      if (canLink && linksReadOk && linksChanged) {
        // Keep the form open on failure so only the links are retried.
        if (!(await syncDevices())) return
      }

      navigate(`/documents/${doc.id}`)
    } catch (err) {
      setSaveError('Failed to save document: ' + (err as Error).message)
      console.error('Error saving document:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    navigate(`/documents/${doc.id}`)
  }

  return (
    <>
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDiscardModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Discard Changes?</h3>
                <p className="text-sm text-slate-500 mt-1">All unsaved changes will be lost. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {attachmentWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900">The document was saved, but its file needs attention.</p>
            <p className="text-xs text-amber-700 mt-1">{attachmentWarning}</p>
          </div>
        )}

        {linkWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900">The document was saved, but its device links were not.</p>
            <p className="text-xs text-amber-700 mt-1">{linkWarning}</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={retryLinkDevices}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Retry device linking
              </button>
              <button
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                Continue without these links
              </button>
            </div>
          </div>
        )}

        {pendingRevision && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900">
              Revision {pendingRevision.version} is awaiting approval
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Only one revision can be pending per document. An admin must approve or reject it before
              a new revision can be saved. The document currently shown to users is unchanged.
            </p>
          </div>
        )}

        {!pendingRevision && mustRevise && !createNewVersion && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900">This document is already published</p>
            <p className="text-xs text-blue-700 mt-1">
              Tick “Create New Version” to propose changes as a revision awaiting approval. Saving without it
              is blocked so approved content can never be replaced silently.
            </p>
          </div>
        )}
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setShowDiscardModal(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Edit Document</h1>
              <p className="text-sm text-slate-500 mt-0.5">{doc.code} · {doc.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiscardModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving ||
                (createNewVersion && (
                  !!pendingRevision ||
                  !form.versionNotes.trim()
                ))
              }
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {createNewVersion ? `Submit ${targetVersion} for approval` : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* main form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Details</h2>
              
              {/* title */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. POS Installation SOP"
                />
              </div>

              {/* type + code */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Document Type *
                  </label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value as DocType })}
                      className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                    >
                      <option>SOP</option>
                      <option>Technical Document</option>
                      <option>Operational Case</option>
                      <option>Org Info</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Document Code
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. SOP-105"
                  />
                </div>
              </div>

              {/* description */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of this document's purpose..."
                />
              </div>

              {/* tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. POS, Installation, Hardware (comma separated)"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple tags with commas</p>
              </div>
            </div>

            {/* file upload + category */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Attachments & Additional Info</h2>

              {form.type === 'Operational Case' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Case Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Hardware, Network, Software, POS"
                  />
                </div>
              )}

              {can(PERMISSIONS.UPLOAD_DOCUMENTS) ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Replace / Add File (optional)
                </label>
                <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  file ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}>
                  <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {file ? (
                      <p className="text-xs font-medium text-blue-700 truncate">{file.name}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Click to choose a new file</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PDF, Word, Excel, PNG, JPEG or plain text — max 10MB
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Replacing keeps the previous version's file intact.
                    </p>
                  </div>
                  {file && (
                    <button type="button" onClick={e => { e.preventDefault(); setFile(null); setFileError(null) }} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                    onChange={e => {
                      const chosen = e.target.files?.[0] || null
                      setFile(chosen)
                      setFileError(chosen ? validateAttachmentFile(chosen) : null)
                    }}
                  />
                </label>
                {fileError && (
                  <p className="text-xs text-red-600 mt-1.5">{fileError}</p>
                )}
              </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Your role cannot attach files to documents.
                </p>
              )}
            </div>

            {/* linked devices */}
            {devicesError ? (
              <div className="bg-white rounded-xl border border-red-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Linked Devices</h2>
                <p className="text-xs text-red-700">{devicesError}</p>
                <p className="text-xs text-slate-500 mt-1">Device linking stays off until the current links can be read.</p>
                <button
                  onClick={loadLinkedDevices}
                  disabled={saving}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                >
                  Retry loading devices
                </button>
              </div>
            ) : devicesUnavailable ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-amber-900 mb-1">Linked Devices</h2>
                <p className="text-xs text-amber-700">{DEVICES_UNAVAILABLE_MESSAGE}</p>
              </div>
            ) : canLink ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Linked Devices</h2>
                <p className="text-xs text-slate-500 mb-4">Shared metadata — these links are saved immediately, not part of a revision</p>
                <DevicePicker selectedIds={deviceIds} onChange={setDeviceIds} disabled={saving} />
              </div>
            ) : (
              can(PERMISSIONS.VIEW_DEVICES) && deviceIds.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">Linked Devices</h2>
                  <p className="text-xs text-slate-500">These links are read-only: a published document or someone else's document can only be relinked by its owner or a manager.</p>
                </div>
              )
            )}

            {/* content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
              <textarea
                rows={16}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Enter document content here..."
              />
            </div>
          </div>

          {/* sidebar */}
          <div className="space-y-5">
            {/* current version info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Current Version</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Version</span>
                  <span className="text-sm font-semibold text-slate-900">{doc.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {doc.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Owner</span>
                  <span className="text-sm font-medium text-slate-900">{doc.users?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* version history */}
            {doc.versions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  Version History
                </h2>
                <div className="space-y-2">
                  {doc.versions.map((v: { version: string; created_at: string; notes: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GitBranch className="w-2.5 h-2.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold text-slate-900">{v.version}</p>
                          <p className="text-[10px] text-slate-400">{v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}</p>
                        </div>
                        <p className="text-[10px] text-slate-600 truncate">{v.notes}</p>
                        <p className="text-[10px] text-slate-400">by Unknown</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* version notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Version Options</h2>
              
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="createNewVersion"
                  checked={createNewVersion}
                  onChange={e => setCreateNewVersion(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="createNewVersion" className="block text-xs font-semibold text-slate-900 mb-1">
                    Create New Version
                  </label>
                  <p className="text-xs text-slate-500">
                    {createNewVersion
                      ? `Saves ${targetVersion} as a revision awaiting approval. The live document is unchanged until an admin approves it.`
                      : 'Will update current version without creating a new one'}
                  </p>
                </div>
              </div>

              {createNewVersion && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={targetVersion}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed font-semibold"
                  />
                </div>
              )}

              {createNewVersion && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Version Notes *
                  </label>
                  <textarea
                    rows={4}
                    value={form.versionNotes}
                    onChange={e => setForm({ ...form, versionNotes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe what changed in this version..."
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Version notes help track changes over time
                  </p>
                </div>
              )}
            </div>

            {/* info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Saving Changes</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {createNewVersion
                      ? `${targetVersion} is stored as a pending revision. Support Agents keep seeing ${doc.version} until an admin approves it.`
                      : 'Changes will update the current version directly without creating a new version.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
