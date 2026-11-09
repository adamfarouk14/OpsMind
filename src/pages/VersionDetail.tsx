import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocumentById } from '../services/documents'
import { extractAttachments, normalizeStoragePath, getSignedAttachmentUrl } from '../lib/attachments'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft,
  Download,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Tag,
  GitBranch,
  Loader2,
  ArrowUpRight,
} from 'lucide-react'

type VersionAuthor = { name: string; initials: string; avatar_color: string } | null

export function VersionDetail() {
  const { id, versionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return
        const documentData = await getDocumentById(id)
        setDoc(documentData)
      } catch (err) {
        setError('Failed to load version: ' + (err as Error).message)
        console.error('Error loading version:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading version...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-red-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Version</h2>
        <p className="text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(id ? `/documents/${id}` : '/documents')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Document
        </button>
      </div>
    )
  }

  const version = (doc?.versions || []).find((v: any) => v.id === versionId)

  if (!version) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Version Not Found</h2>
        <p className="text-slate-500 mb-4">This version does not exist or was removed.</p>
        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Back to Document
        </button>
      </div>
    )
  }

  const isCurrent = version.version === doc.version

  const markerAttachments = extractAttachments(version.content ?? null)
  const attachments = [...markerAttachments]
  if (version.file_path) {
    const path = normalizeStoragePath(version.file_path)
    if (path && !path.startsWith('http') && !attachments.some(a => a.path === path)) {
      attachments.push({ path, fileName: version.file_name || path.split('/').pop() || path })
    }
  }

  const handleAttachmentDownload = async (path: string) => {
    try {
      const url = await getSignedAttachmentUrl(path)
      const a = document.createElement('a')
      a.href = url
      a.download = path.split('/').pop() || 'attachment'
      a.click()
    } catch (err) {
      console.error('Failed to open attachment:', err)
      alert('Could not open this attachment')
    }
  }

  // Versions created before snapshot fields existed carry null values; the document
  // row only holds the latest state, so we show what the snapshot actually recorded.
  const snapshotMissing =
    version.content == null && version.title == null && version.description == null

  const author = version.users as VersionAuthor
  const tags: string[] = version.tags || []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/documents/${id}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {version.title || doc.title}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                <GitBranch className="w-3 h-3" />
                Version {version.version}
              </span>
              {isCurrent && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-600 text-white rounded">Current</span>
              )}
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">Read-only</span>
            </div>
            <p className="text-sm text-slate-500">
              {doc.code} · Snapshot of {doc.title}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Open Current Document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Version Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Created by</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${author?.avatar_color || 'bg-slate-100 text-slate-600'}`}>
                      {author?.initials || author?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {version.author_id === user?.id ? 'You' : (author?.name || 'Unknown')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Created</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(version.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Type</p>
                  <p className="text-sm font-medium text-slate-900">{version.type || doc.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Status at the time</p>
                  <p className="text-sm font-medium text-slate-900">{version.status || 'Not recorded'}</p>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase">Tags</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag: string) => (
                    <span key={tag} className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {snapshotMissing ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-800 mb-1">No content snapshot</h2>
                  <p className="text-sm text-amber-700">
                    This version was created before full snapshot recording existed, so its content,
                    description and title were not stored. Only its number, notes and date are available.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {version.description || <span className="text-slate-400 italic">Not recorded for this version</span>}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Document Content</h2>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                    {version.content ?? ''}
                  </pre>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Attachments</p>
                    <div className="space-y-1.5">
                      {attachments.map(a => (
                        <button
                          key={a.path}
                          onClick={() => handleAttachmentDownload(a.path)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {a.fileName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {version.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Version Notes</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{version.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase">Other Versions</h3>
            <div className="space-y-2">
              {(doc.versions || [])
                .filter((v: any) => v.id !== version.id)
                .map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => navigate(`/documents/${id}/versions/${v.id}`)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
                  >
                    <span className="font-medium">{v.version}</span>
                    <span className="text-xs text-slate-400">{new Date(v.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              {(doc.versions || []).length <= 1 && (
                <p className="text-xs text-slate-400 text-center py-2">No other versions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
