import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices, getDeviceLinkCounts, archiveDevice, deleteDevice, isDevicesSchemaMissing } from '../services/devices'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../lib/permissions'
import { CATEGORY_STYLES, DEVICES_UNAVAILABLE_MESSAGE, DEVICE_CATEGORIES, DEVICE_STATUS_STYLES } from '../lib/devices'
import type { Device, DeviceCategory, DeviceStatus } from '../types/database'
import {
  Plus,
  Search,
  Filter,
  HardDrive,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Loader2,
  Pencil,
  Archive,
  Trash2,
} from 'lucide-react'

type SortField = 'name' | 'category' | 'status' | 'documents' | 'updatedAt'

export function Devices() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<DeviceCategory | 'All'>('All')
  const [activeStatus, setActiveStatus] = useState<DeviceStatus | 'All'>('All')
  const [sortBy, setSortBy] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [busyId, setBusyId] = useState<string | null>(null)

  const canManage = can(PERMISSIONS.MANAGE_DEVICES)
  const canDelete = can(PERMISSIONS.DELETE_DEVICES)

  useEffect(() => {
    async function load() {
      try {
        const [rows, counts] = await Promise.all([getDevices(), getDeviceLinkCounts()])
        setDevices(rows)
        setLinkCounts(counts)
      } catch (err) {
        console.error('Error loading devices:', err)
        if (isDevicesSchemaMissing(err)) setUnavailable(true)
        else setError('Failed to load devices: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = devices.filter(device => {
    const term = search.toLowerCase()
    const matchSearch =
      device.name.toLowerCase().includes(term) ||
      device.manufacturer.toLowerCase().includes(term) ||
      device.model_number.toLowerCase().includes(term)
    const matchCategory = activeCategory === 'All' || device.category === activeCategory
    const matchStatus = activeStatus === 'All' || device.status === activeStatus
    return matchSearch && matchCategory && matchStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'documents':
        comparison = (linkCounts[a.id] || 0) - (linkCounts[b.id] || 0)
        break
      case 'updatedAt':
        comparison = a.updated_at.localeCompare(b.updated_at)
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  const sortIcon = (field: SortField) =>
    sortBy === field
      ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ArrowUpDown className="w-3 h-3 opacity-40" />

  const handleArchive = async (device: Device) => {
    if (!window.confirm(`Archive "${device.name}"? It stays linked to its documents.`)) return
    try {
      setBusyId(device.id)
      await archiveDevice(device.id)
      await logActivity({
        user_id: user?.id,
        action: 'edit',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Archived device: ${device.name}`,
      })
      setDevices(prev => prev.map(d => (d.id === device.id ? { ...d, status: 'Archived' } : d)))
    } catch (err) {
      console.error('Failed to archive device:', err)
      alert('Failed to archive device: ' + (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (device: Device) => {
    const linked = linkCounts[device.id] || 0
    const unlinkNote = linked === 0
      ? 'No documents are linked to it.'
      : `This will unlink it from ${linked} document${linked === 1 ? '' : 's'}. The documents themselves are not deleted.`
    if (!window.confirm(`Delete "${device.name}"?\n\n${unlinkNote}\n\nThis cannot be undone.`)) return

    try {
      setBusyId(device.id)
      await deleteDevice(device.id)
      await logActivity({
        user_id: user?.id,
        action: 'delete',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Deleted device: ${device.name} (${linked} document link(s) removed)`,
      })
      setDevices(prev => prev.filter(d => d.id !== device.id))
    } catch (err) {
      console.error('Failed to delete device:', err)
      alert('Failed to delete device: ' + (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading devices...</span>
        </div>
      )}

      {/* Header and New Device stay reachable even when the tables are missing. */}
      {!loading && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Devices</h1>
            {!unavailable && (
              <p className="text-[13px] text-slate-500 mt-0.5">
                {devices.length} devices · hardware profiles linked to SOPs, Technical Documents and Operational Cases
              </p>
            )}
          </div>
          {canManage && (
            <button
              onClick={() => navigate('/devices/create')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Device
            </button>
          )}
        </div>
      )}

      {unavailable && (
        <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl py-14 px-6 text-center">
          <HardDrive className="w-10 h-10 text-amber-300 mb-3" />
          <p className="text-[13px] font-semibold text-amber-900">{DEVICES_UNAVAILABLE_MESSAGE}</p>
          <p className="text-[12px] text-amber-700 mt-1 max-w-md">
            Documents and every other part of the workspace keep working normally until the setup is finished.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && !unavailable && (
        <>
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by device, manufacturer or model…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value as DeviceCategory | 'All')}
                className="text-[12px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
              >
                <option value="All">All Categories</option>
                {DEVICE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-slate-500 font-medium">Status:</span>
              {(['All', 'Active', 'Archived'] as const).map(s => (
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

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left py-3 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Device {sortIcon('name')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Category {sortIcon('category')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Status {sortIcon('status')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <button onClick={() => handleSort('documents')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Documents {sortIcon('documents')}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">
                      <button onClick={() => handleSort('updatedAt')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Updated {sortIcon('updatedAt')}
                      </button>
                    </th>
                    <th className="py-3 px-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <HardDrive className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-[13px] font-medium text-slate-400">No devices found</p>
                        <p className="text-[12px] text-slate-300 mt-1">Try adjusting your filters or search term</p>
                      </td>
                    </tr>
                  ) : (
                    sorted.map(device => (
                      <tr
                        key={device.id}
                        onClick={() => navigate(`/devices/${device.id}`)}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                            {device.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{device.manufacturer} · {device.model_number}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded ${CATEGORY_STYLES[device.category]}`}>
                            {device.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded ${DEVICE_STATUS_STYLES[device.status]}`}>
                            {device.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[12px] text-slate-600">{linkCounts[device.id] || 0}</td>
                        <td className="py-3.5 px-3 text-[12px] text-slate-400 hidden lg:table-cell">
                          {new Date(device.updated_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canManage && (
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/devices/${device.id}/edit`) }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit device"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManage && device.status === 'Active' && (
                              <button
                                onClick={e => { e.stopPropagation(); handleArchive(device) }}
                                disabled={busyId === device.id}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40"
                                title="Archive device"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(device) }}
                                disabled={busyId === device.id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                title="Delete device"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Showing {sorted.length} of {devices.length} devices
              </span>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-400">
                  {devices.filter(d => d.status === 'Active').length} Active
                </span>
                <span className="text-[11px] text-slate-400">
                  {devices.filter(d => d.status === 'Archived').length} Archived
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
