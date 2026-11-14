import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDevice, isDevicesSchemaMissing } from '../services/devices'
import { logActivity } from '../services/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { DEVICES_UNAVAILABLE_MESSAGE, DEVICE_CATEGORIES, DEVICE_MANUFACTURERS } from '../lib/devices'
import type { DeviceCategory } from '../types/database'
import { ArrowLeft, Save, X, ChevronDown } from 'lucide-react'

export function CreateDevice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    model_number: '',
    category: 'Other' as DeviceCategory,
    description: '',
    specifications: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = form.name.trim() && form.manufacturer.trim() && form.model_number.trim()

  const handleCreate = async () => {
    if (!isFormValid) {
      setError('Device name, manufacturer and model number are required.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const device = await createDevice({
        name: form.name,
        manufacturer: form.manufacturer,
        model_number: form.model_number,
        category: form.category,
        description: form.description.trim() || null,
        specifications: form.specifications.trim() || null,
      })
      await logActivity({
        user_id: user?.id,
        action: 'create',
        target_type: 'device',
        target_id: device.id,
        target_title: device.name,
        details: `Created device: ${device.name} (${device.manufacturer} ${device.model_number})`,
      })
      navigate(`/devices/${device.id}`)
    } catch (err) {
      console.error('Failed to create device:', err)
      setError(isDevicesSchemaMissing(err) ? DEVICES_UNAVAILABLE_MESSAGE : (err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create New Device</h1>
            <p className="text-sm text-slate-500 mt-0.5">Add a hardware profile to the knowledge base</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/devices')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Creating...' : 'Create Device'}
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
                placeholder="e.g. Counter POS Terminal"
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
                    {DEVICE_MANUFACTURERS.map(manufacturer => (
                      <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model Number *</label>
                <input
                  type="text"
                  value={form.model_number}
                  onChange={e => setForm({ ...form, model_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. T2 Lite"
                />
                <p className="text-xs text-slate-400 mt-1">Manufacturer + model must be unique</p>
              </div>
            </div>

            <div className="mb-4">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="What this device is used for..."
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
              placeholder={'Processor: ...\nMemory: ...\nPorts: ...\nOperating system: ...'}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Before you save</h2>
            <ul className="space-y-2 text-[12px] text-slate-600 leading-relaxed list-disc list-inside">
              <li>Documents are linked to this device from the document pages.</li>
              <li>Links are shared metadata, not a new document version.</li>
              <li>Only Admin and Manager can create or edit devices.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
