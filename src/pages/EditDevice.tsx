import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDeviceById, updateDevice, isDevicesSchemaMissing } from '../services/devices'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import {
  DEVICES_UNAVAILABLE_MESSAGE,
  DEVICE_CATEGORIES,
  DEVICE_MANUFACTURERS,
  DEVICE_STATUSES,
  getManufacturerOptions,
} from '../lib/devices'
import type { DeviceCategory, DeviceStatus } from '../types/database'
import { ArrowLeft, Save, X, ChevronDown, Loader2 } from 'lucide-react'

export function EditDevice() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    model_number: '',
    category: 'Other' as DeviceCategory,
    status: 'Active' as DeviceStatus,
    description: '',
    specifications: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const device = await getDeviceById(id!)
        setForm({
          name: device.name,
          manufacturer: device.manufacturer,
          model_number: device.model_number,
          category: device.category,
          status: device.status,
          description: device.description || '',
          specifications: device.specifications || '',
        })
      } catch (err) {
        console.error('Failed to load device:', err)
        setError(
          isDevicesSchemaMissing(err)
            ? DEVICES_UNAVAILABLE_MESSAGE
            : 'Failed to load device: ' + (err as Error).message
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const isFormValid = form.name.trim() && form.manufacturer.trim() && form.model_number.trim()

  const manufacturerOptions = getManufacturerOptions(form.manufacturer)

  const handleSave = async () => {
    if (!id) return
    if (!isFormValid) {
      setError('Device name, manufacturer and model number are required.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const device = await updateDevice(id, {
        name: form.name,
        manufacturer: form.manufacturer,
        model_number: form.model_number,
        category: form.category,
        status: form.status,
        description: form.description.trim() || null,
        specifications: form.specifications.trim() || null,
      })
      await logActivity({
        user_id: user?.id,
        action: 'edit',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Edited device: ${device.name}`,
      })
      navigate(`/devices/${device.id}`)
    } catch (err) {
      console.error('Failed to update device:', err)
      setError(isDevicesSchemaMissing(err) ? DEVICES_UNAVAILABLE_MESSAGE : (err as Error).message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading device...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/devices/${id}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Device</h1>
            <p className="text-sm text-slate-500 mt-0.5">{form.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/devices/${id}`)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Device Details</h2>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Device Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Manufacturer *</label>
                <div className="relative">
                  <select
                    value={form.manufacturer}
                    onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                    className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                  >
                    <option value="">Select a manufacturer</option>
                    {manufacturerOptions.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                {!DEVICE_MANUFACTURERS.includes(form.manufacturer) && form.manufacturer && (
                  <p className="text-xs text-slate-400 mt-1">Saved value is not in the standard list yet</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model Number *</label>
                <input
                  type="text"
                  value={form.model_number}
                  onChange={e => setForm({ ...form, model_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">Manufacturer + model must be unique</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as DeviceCategory })}
                    className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                  >
                    {DEVICE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status *</label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as DeviceStatus })}
                    className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                  >
                    {DEVICE_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Specifications</h2>
            <textarea
              rows={8}
              value={form.specifications}
              onChange={e => setForm({ ...form, specifications: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Editing notes</h2>
            <ul className="space-y-2 text-[12px] text-slate-600 leading-relaxed list-disc list-inside">
              <li>Device edits do not create document versions.</li>
              <li>Archiving keeps the links to documents.</li>
              <li>Deleting a device is Admin-only and unlinks its documents.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
