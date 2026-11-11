import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDeviceById, countLinkedDocuments, archiveDevice, deleteDevice, isDevicesSchemaMissing } from '../services/devices'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../lib/permissions'
import { CATEGORY_STYLES, DEVICES_UNAVAILABLE_MESSAGE, DEVICE_STATUS_STYLES } from '../lib/devices'
import type { DeviceStatus, DeviceWithDocuments, DocStatus, DocType, DocumentWithOwner } from '../types/database'
import {
  ArrowLeft,
  Archive,
  Trash2,
  Pencil,
  FileText,
  HardDrive,
  Loader2,
} from 'lucide-react'

const DOC_TYPE_ORDER: DocType[] = ['Technical Document', 'SOP', 'Operational Case', 'Org Info']

const DOC_STATUS_STYLES: Record<DocStatus, string> = {
  Approved: 'bg-green-100 text-green-700',
  'In Review': 'bg-amber-100 text-amber-700',
  Draft: 'bg-slate-100 text-slate-600',
  Rejected: 'bg-red-100 text-red-600',
}

export function DeviceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user, can } = useAuth()
  const [device, setDevice] = useState<DeviceWithDocuments | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canManage = can(PERMISSIONS.MANAGE_DEVICES)
  const canDelete = can(PERMISSIONS.DELETE_DEVICES)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        setDevice(await getDeviceById(id!))
      } catch (err) {
        console.error('Error loading device:', err)
        if (isDevicesSchemaMissing(err)) setUnavailable(true)
        else setError('Failed to load device: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading device...</span>
      </div>
    )
  }

  if (unavailable) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/devices')} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Devices
        </button>
        <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl py-14 px-6 text-center">
          <HardDrive className="w-10 h-10 text-amber-300 mb-3" />
          <p className="text-[13px] font-semibold text-amber-900">{DEVICES_UNAVAILABLE_MESSAGE}</p>
        </div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/devices')} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Devices
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error || 'Device not found.'}</p>
        </div>
      </div>
    )
  }

  const grouped = DOC_TYPE_ORDER.map(type => ({
    type,
    rows: (device.documents as DocumentWithOwner[]).filter(doc => doc.type === type),
  })).filter(group => group.rows.length > 0)

  const handleArchive = async () => {
    if (!window.confirm(`Archive "${device.name}"? It stays linked to its documents.`)) return
    try {
      setBusy(true)
      await archiveDevice(device.id)
      await logActivity({
        user_id: user?.id,
        action: 'edit',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Archived device: ${device.name}`,
      })
      setDevice({ ...device, status: 'Archived' as DeviceStatus })
    } catch (err) {
      console.error('Failed to archive device:', err)
      alert('Failed to archive device: ' + (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    let linked: number
    try {
      linked = await countLinkedDocuments(device.id)
    } catch (err) {
      console.error('Failed to count linked documents:', err)
      alert('The linked documents could not be checked, so the device was not deleted: ' + (err as Error).message)
      return
    }

    const unlinkNote = linked === 0
      ? 'No documents are linked to it.'
      : `This will unlink it from ${linked} document${linked === 1 ? '' : 's'}. The documents themselves are not deleted.`
    if (!window.confirm(`Delete "${device.name}"?\n\n${unlinkNote}\n\nThis cannot be undone.`)) return

    try {
      setBusy(true)
      await deleteDevice(device.id)
      await logActivity({
        user_id: user?.id,
        action: 'delete',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Deleted device: ${device.name} (${linked} document link(s) removed)`,
      })
      navigate('/devices')
    } catch (err) {
      console.error('Failed to delete device:', err)
      alert('Failed to delete device: ' + (err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/devices')} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Devices
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{device.name}</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {device.manufacturer} · {device.model_number}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-semibold px-2 py-1 rounded ${CATEGORY_STYLES[device.category]}`}>
                {device.category}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded ${DEVICE_STATUS_STYLES[device.status]}`}>
                {device.status}
              </span>
            </div>
          </div>
        </div>

        {(canManage || canDelete) && (
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => navigate(`/devices/${device.id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                {device.status === 'Active' && (
                  <button
                    onClick={handleArchive}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-amber-50 text-amber-600 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}
              </>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 text-red-600 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Device Profile</h2>
            <dl className="grid sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Manufacturer</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{device.manufacturer}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Model Number</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{device.model_number}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Category</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{device.category}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{device.status}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Created</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{new Date(device.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Last Updated</dt>
                <dd className="text-[13px] text-slate-700 mt-1">{new Date(device.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Description</h2>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {device.description || 'No description yet.'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Specifications</h2>
            {device.specifications ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {device.specifications}
              </pre>
            ) : (
              <p className="text-[13px] text-slate-400">No specifications yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Related Knowledge
              <span className="ml-1.5 text-[11px] font-semibold text-slate-400">({device.documents.length})</span>
            </h2>

            {grouped.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[12px] text-slate-400">No documents linked to this device yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {grouped.map(group => (
                  <div key={group.type}>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      {group.type}s
                    </p>
                    <div className="space-y-1.5">
                      {group.rows.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="w-full text-left px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                        >
                          <p className="text-[12px] font-medium text-slate-700 leading-snug">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">{doc.code}</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${DOC_STATUS_STYLES[doc.status]}`}>
                              {doc.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h2>
            <button
              onClick={() => navigate('/documents')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Browse all documents
            </button>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Links are shared metadata: adding or removing one does not create a new document version
              and does not need approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
