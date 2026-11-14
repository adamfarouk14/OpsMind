import { useEffect, useMemo, useState } from 'react'
import { getDevices, isDevicesSchemaMissing } from '../services/devices'
import { CATEGORY_STYLES, DEVICES_UNAVAILABLE_MESSAGE, DEVICE_STATUS_STYLES } from '../lib/devices'
import type { Device } from '../types/database'
import { ChevronDown, HardDrive, Loader2, Search } from 'lucide-react'

interface DevicePickerProps {
  selectedIds: string[]
  onChange: (deviceIds: string[]) => void
  disabled?: boolean
}

export function DevicePicker({ selectedIds, onChange, disabled }: DevicePickerProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open || devices.length > 0 || loadFailed) return
    async function load() {
      try {
        setLoading(true)
        setDevices(await getDevices())
      } catch (err) {
        console.error('Failed to load devices:', err)
        setSchemaMissing(isDevicesSchemaMissing(err))
        setLoadFailed(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, devices.length, loadFailed])

  const visible = useMemo(() => {
    const term = search.toLowerCase()
    return devices.filter(device =>
      device.name.toLowerCase().includes(term) ||
      device.manufacturer.toLowerCase().includes(term) ||
      device.model_number.toLowerCase().includes(term))
  }, [devices, search])

  const selected = devices.filter(device => selectedIds.includes(device.id))

  const toggle = (deviceId: string) => {
    onChange(
      selectedIds.includes(deviceId)
        ? selectedIds.filter(id => id !== deviceId)
        : [...selectedIds, deviceId])
  }

  if (loadFailed) {
    return (
      <p className="text-xs text-amber-600">
        {schemaMissing
          ? DEVICES_UNAVAILABLE_MESSAGE
          : 'Device catalogue is unavailable, so links are disabled for now.'}
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-slate-600 truncate">
          {selected.length === 0
            ? 'No devices selected'
            : selected.map(device => device.name).join(', ')}
        </p>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-700 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <HardDrive className="w-3.5 h-3.5" />
          Choose devices
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-3 border border-slate-200 rounded-lg bg-slate-50/60 p-3">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search devices…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="ml-2 text-[12px] text-slate-500">Loading devices...</span>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-[12px] text-slate-400 text-center py-6">No devices match this search.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {visible.map(device => (
                <label
                  key={device.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(device.id)}
                    onChange={() => toggle(device.id)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] font-medium text-slate-700 truncate">{device.name}</span>
                    <span className="block text-[11px] text-slate-400 truncate">
                      {device.manufacturer} · {device.model_number}
                    </span>
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_STYLES[device.category]}`}>
                    {device.category}
                  </span>
                  {device.status === 'Archived' && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${DEVICE_STATUS_STYLES.Archived}`}>
                      Archived
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-400">{selected.length} selected</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-[12px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
