import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DocType } from '../types/database'
import { createDocument, createDocumentVersion, updateDocument } from '../services/documents'
import { syncDocumentDevices } from '../services/devices'
import {
  buildAttachmentPath,
  storeAttachmentForRevision,
  validateAttachmentFile,
} from '../services/attachments'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { DevicePicker } from '../components/DevicePicker'
import { PERMISSIONS } from '../lib/permissions'
import { ArrowLeft, Save, X, AlertCircle, ChevronDown, FileText, Loader2, Upload } from 'lucide-react'

export function CreateDocument() {
  const navigate = useNavigate()
  const { user, can } = useAuth()

  const [form, setForm] = useState({
    title: '',
    code: '',
    type: 'SOP' as DocType,
    description: '',
    content: '',
    tags: '',
    category: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null)
  const [deviceIds, setDeviceIds] = useState<string[]>([])
  const [createdDocId, setCreatedDocId] = useState<string | null>(null)
  const [linkWarning, setLinkWarning] = useState<string | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Returns false when the links were refused, so the caller can stop short
  // of navigating and keep the chosen devices on screen.
  const syncDevices = async (documentId: string): Promise<boolean> => {
    try {
      await syncDocumentDevices(documentId, deviceIds)
      setLinkWarning(null)
      return true
    } catch (err) {
      console.error('Failed to link devices:', err)
      setLinkWarning(`The document was saved, but its device links were not: ${(err as Error).message}`)
      return false
    }
  }

  const generateCode = (type: DocType): string => {
    const prefixes: Record<DocType, string> = {
      'SOP': 'SOP',
      'Technical Document': 'TG',
      'Operational Case': 'OC',
      'Org Info': 'ORG',
    }
    const prefix = prefixes[type]
    const num = Math.floor(100 + Math.random() * 900)
    return `${prefix}-${num}`
  }

  const handleCreate = async () => {
    if (!user) {
      setError('You must be logged in to create a document')
      return
    }

    if (file && !can(PERMISSIONS.UPLOAD_DOCUMENTS)) {
      setFileError('Your role cannot attach files to documents.')
      return
    }

    if (file) {
      const invalid = validateAttachmentFile(file)
      if (invalid) {
        setFileError(invalid)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)
      setAttachmentWarning(null)

      const finalCode = form.code.trim() || generateCode(form.type)

      // Build tags — include category as a tag for Operational Cases
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      if (form.type === 'Operational Case' && form.category.trim()) {
        tagsArray.unshift(`Category: ${form.category.trim()}`)
      }

      // The row comes first: an attachment is authorized by a registry record
      // that points at an existing document.
      const doc = await createDocument({
        title: form.title,
        code: finalCode,
        type: form.type,
        version: 'v1.0',
        description: form.description,
        content: form.content,
        tags: tagsArray,
        status: 'Draft',
        owner_id: user.id,
      })

      // Remember the draft so a failed link can be retried without creating a duplicate.
      setCreatedDocId(doc.id)

      const snapshotVersion = async (content: string, filePath: string | null, fileName: string | null) => {
        const version = await createDocumentVersion(doc.id, {
          version: 'v1.0',
          author_id: user.id,
          notes: 'Initial version',
          title: form.title,
          description: form.description,
          content,
          type: form.type,
          status: 'Draft',
          tags: tagsArray,
          file_path: filePath,
          file_name: fileName,
        })
        return version?.id ?? null
      }

      // The initial file belongs to version v1.0, so its association is
      // version-scoped: the file is stored, the snapshot is written with it, and
      // only then does the registry bind the two. The live document row gets no
      // association of its own, so nothing is inherited.
      try {
        if (file) {
          const path = buildAttachmentPath(user.id, finalCode, file.name)
          try {
            const notice = await storeAttachmentForRevision(file, path, doc.id, async () => {
              const content = `${form.content}\n\n[Attached file: ${path}]`
              await updateDocument(doc.id, { content })
              return snapshotVersion(content, path, file.name)
            })
            if (notice) setAttachmentWarning(notice)
          } catch (err) {
            // The draft is already saved, so report the problem and stay put.
            console.error('Failed to attach the initial file or record its version:', err)
            setAttachmentWarning('The document was saved, but its first version or file was not recorded: ' + (err as Error).message)
          }
        } else {
          await snapshotVersion(form.content, null, null)
        }
      } catch (err) {
        console.error('Failed to record initial version:', err)
        setAttachmentWarning('The document was saved, but its initial version was not recorded.')
      }

      const linkFailed = deviceIds.length > 0 && !(await syncDevices(doc.id))

      await logActivity({
        user_id: user.id,
        action: 'create',
        target_type: 'document',
        target_id: doc.id,
        target_title: form.title,
        target_code: form.code,
        details: `Created new ${form.type}: ${form.title}`,
      })

      // Keep the draft on screen so only the links are retried.
      if (linkFailed) return

      navigate('/documents')
    } catch (err) {
      setError('Failed to create document: ' + (err as Error).message)
      console.error('Error creating document:', err)
    } finally {
      setLoading(false)
    }
  }

  // Re-sends only the links of the draft that was already saved.
  const retryLinkDevices = async () => {
    if (!createdDocId) return
    try {
      setLoading(true)
      await syncDevices(createdDocId)
    } finally {
      setLoading(false)
    }
  }

  const continueWithoutRelinking = () => {
    navigate('/documents')
  }

  const handleDiscard = () => {
    navigate('/documents')
  }

  const isFormValid = form.title.trim() !== ''

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
                <h3 className="text-base font-bold text-slate-900">Discard New Document?</h3>
                <p className="text-sm text-slate-500 mt-1">The document you're creating will not be saved. This action cannot be undone.</p>
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
                Discard Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
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
                onClick={continueWithoutRelinking}
                className="px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                Continue without these links
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-3 text-sm text-slate-500">Creating document...</span>
          </div>
        )}

        {!loading && (
          <>
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
              <h1 className="text-xl font-bold text-slate-900">Create New Document</h1>
              <p className="text-sm text-slate-500 mt-0.5">Add a new document to the knowledge base</p>
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
              onClick={handleCreate}
              disabled={!isFormValid || createdDocId !== null}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {createdDocId !== null ? 'Document Saved' : 'Create Document'}
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
                    placeholder="e.g. SOP-108"
                  />
                  <p className="text-xs text-slate-400 mt-1">Auto-generated if left empty</p>
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
                  placeholder="Brief description of this document's purpose for technical support..."
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

            {/* file upload + category for Operational Case */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Attachments & Additional Info</h2>

              {/* category — only for Operational Case */}
              {form.type === 'Operational Case' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Case Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Hardware, Network, Software, POS"
                  />
                  <p className="text-xs text-slate-400 mt-1">Used to categorize this operational case</p>
                </div>
              )}

              {/* file upload */}
              {can(PERMISSIONS.UPLOAD_DOCUMENTS) ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attach File (optional)
                </label>
                <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  file ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}>
                  <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {file ? (
                      <p className="text-xs font-medium text-blue-700 truncate">{file.name}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Click to choose a file</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PDF, Word, Excel, PNG, JPEG or plain text — max 10MB
                    </p>
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setFile(null); setFileError(null) }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
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
            {can(PERMISSIONS.LINK_DEVICES) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Linked Devices</h2>
                <p className="text-xs text-slate-500 mb-4">Attach this document to the devices it applies to</p>
                <DevicePicker selectedIds={deviceIds} onChange={setDeviceIds} disabled={loading} />
              </div>
            )}

            {/* content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
              <textarea
                rows={16}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Enter document content here...&#10;&#10;You can use markdown formatting:&#10;## Headings&#10;- Bullet points&#10;1. Numbered lists"
              />
            </div>
          </div>

          {/* sidebar */}
          <div className="space-y-5">
            {/* document type guide */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Document Types</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">SOP</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Step-by-step operational procedures
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Technical Document</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Guides, specifications, troubleshooting
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Operational Case</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real cases with problem and resolution
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Org Info</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Team procedures and policies
                  </p>
                </div>
              </div>
            </div>

            {/* tips */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Writing Tips</h2>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Keep titles clear and descriptive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Include device/system names in tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use numbered steps for procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Add relevant technical details</span>
                </li>
              </ul>
            </div>

            {/* info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Document Status</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    New documents are saved as <strong>Draft</strong>. Submit for approval when ready to publish.
                  </p>
                </div>
              </div>
            </div>

            {/* template suggestion */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Need a Template?</h2>
              <p className="text-xs text-slate-500 mb-3">Start with an existing document as a template</p>
              <button className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                Browse Templates
              </button>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </>
  )
}
