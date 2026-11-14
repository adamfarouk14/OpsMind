import type { DeviceCategory, DeviceStatus } from '../types/database'

// Shown whenever the devices tables are missing because the P1 migration
// has not been applied yet.
export const DEVICES_UNAVAILABLE_MESSAGE =
  'Devices are not available yet. The Devices module setup has not been completed in the database.'

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  'POS',
  'Interactive Display',
  'Printer',
  'Laptop',
  'Computer',
  'Monitor',
  'Barcode Scanner',
  'Mobile',
  'Server',
  'Network',
  'Other',
]

// Application-managed list: add a name here and both device forms pick it up.
export const DEVICE_MANUFACTURERS: string[] = [
  'Hikvision',
  'Riotouch',
  'Cisco',
  'HP',
  'Dell',
  'Lenovo',
  'ASUS',
  'Acer',
  'Samsung',
  'LG',
  'Epson',
  'Brother',
  'Canon',
  'Zebra',
  'Honeywell',
  'TSC',
  'Xprinter',
  'ViewSonic',
  'BenQ',
  'Newline',
  'SMART Technologies',
  'Promethean',
  'Logitech',
  'Yealink',
]

// A saved device may carry a name the list does not have yet; keep it selectable
// so editing never erases real data.
export function getManufacturerOptions(current?: string | null): string[] {
  if (!current || DEVICE_MANUFACTURERS.includes(current)) return DEVICE_MANUFACTURERS
  return [...DEVICE_MANUFACTURERS, current]
}

export const DEVICE_STATUSES: DeviceStatus[] = ['Active', 'Archived']

export const CATEGORY_STYLES: Record<DeviceCategory, string> = {
  POS: 'bg-blue-100 text-blue-700',
  'Interactive Display': 'bg-indigo-100 text-indigo-700',
  Printer: 'bg-teal-100 text-teal-700',
  Laptop: 'bg-purple-100 text-purple-700',
  Computer: 'bg-cyan-100 text-cyan-700',
  Monitor: 'bg-sky-100 text-sky-700',
  'Barcode Scanner': 'bg-amber-100 text-amber-700',
  Mobile: 'bg-rose-100 text-rose-700',
  Server: 'bg-slate-100 text-slate-600',
  Network: 'bg-green-100 text-green-700',
  Other: 'bg-slate-100 text-slate-600',
}

export const DEVICE_STATUS_STYLES: Record<DeviceStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Archived: 'bg-slate-100 text-slate-500',
}
