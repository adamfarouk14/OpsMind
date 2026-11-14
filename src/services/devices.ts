import { supabase } from '../lib/supabase'
import { PERMISSIONS } from '../lib/permissions'
import { getActor, requirePermission } from '../lib/session'
import type {
  Device,
  DeviceCategory,
  DeviceStatus,
  DeviceWithDocuments,
  DocumentWithOwner,
} from '../types/database'

const ELEVATED_ROLES = ['Admin', 'Manager'] as const

export interface DeviceInput {
  name: string
  manufacturer: string
  model_number: string
  category: DeviceCategory
  description?: string | null
  specifications?: string | null
  status?: DeviceStatus
}

const UNIQUE_VIOLATION = '23505'

// The devices tables only exist after the P1 migration, so treat a missing
// relation as "module not set up" instead of leaking the database error.
export function isDevicesSchemaMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null
  const message = (err?.message || '').toLowerCase()
  return (
    err?.code === '42P01' ||
    message.includes('schema cache') ||
    (message.includes('devices') && message.includes('does not exist'))
  )
}

// Visible documents keep the linked documents an agent cannot open.
async function getVisibleDocumentIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('documents')
    .select('id')

  if (error) throw error
  return new Set((data || []).map(row => row.id))
}

function duplicateDeviceError(error: any): Error | null {
  if (error?.code !== UNIQUE_VIOLATION) return null
  return new Error('This manufacturer and model number is already registered.')
}

export async function getDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as Device[]
}

export async function getDeviceById(id: string): Promise<DeviceWithDocuments> {
  const { data: device, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  const actor = await getActor()
  const elevated = ELEVATED_ROLES.includes(actor.role as any)

  let documents: DocumentWithOwner[] = []
  const documentIds = await getLinkedDocumentIds(id)

  if (documentIds.length > 0) {
    let query = supabase
      .from('documents')
      .select(`
        *,
        users:owner_id (
          name,
          initials,
          avatar_color
        )
      `)
      .in('id', documentIds)
      .order('updated_at', { ascending: false })

    if (!elevated) {
      // Mirrors the documents SELECT policy: approved work plus the agent's own drafts.
      query = query.or(`status.eq.Approved,owner_id.eq.${actor.id}`) as any
    }

    const { data: rows, error: documentError } = await query
    if (documentError) throw documentError
    documents = (rows || []) as DocumentWithOwner[]
  }

  return { ...(device as Device), documents }
}

async function getLinkedDocumentIds(deviceId: string) {
  const { data, error } = await supabase
    .from('document_devices')
    .select('document_id')
    .eq('device_id', deviceId)

  if (error) throw error
  return (data || []).map(row => row.document_id)
}

export async function countLinkedDocuments(deviceId: string): Promise<number> {
  const { count, error } = await supabase
    .from('document_devices')
    .select('document_id', { count: 'exact', head: true })
    .eq('device_id', deviceId)

  if (error) throw error
  return count || 0
}

// One read for the whole list page: device id to linked document count.
export async function getDeviceLinkCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('document_devices')
    .select('device_id')

  // A missing table only means the counts column has nothing to show yet.
  if (isDevicesSchemaMissing(error)) return {}
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    counts[row.device_id] = (counts[row.device_id] || 0) + 1
  }
  return counts
}

export async function createDevice(input: DeviceInput): Promise<Device> {
  await requirePermission(PERMISSIONS.MANAGE_DEVICES, 'Your role cannot create devices.')

  const { data, error } = await supabase
    .from('devices')
    .insert({
      name: input.name.trim(),
      manufacturer: input.manufacturer.trim(),
      model_number: input.model_number.trim(),
      category: input.category,
      description: input.description ?? null,
      specifications: input.specifications ?? null,
      status: input.status ?? 'Active',
    })
    .select()
    .single()

  if (error) throw duplicateDeviceError(error) || error
  return data as Device
}

export async function updateDevice(id: string, updates: Partial<DeviceInput>): Promise<Device> {
  await requirePermission(PERMISSIONS.MANAGE_DEVICES, 'Your role cannot edit devices.')

  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.manufacturer !== undefined) payload.manufacturer = updates.manufacturer.trim()
  if (updates.model_number !== undefined) payload.model_number = updates.model_number.trim()
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.description !== undefined) payload.description = updates.description ?? null
  if (updates.specifications !== undefined) payload.specifications = updates.specifications ?? null
  if (updates.status !== undefined) payload.status = updates.status

  const { data, error } = await supabase
    .from('devices')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw duplicateDeviceError(error) || error
  return data as Device
}

export async function archiveDevice(id: string): Promise<Device> {
  return updateDevice(id, { status: 'Archived' })
}

export async function deleteDevice(id: string): Promise<void> {
  await requirePermission(PERMISSIONS.DELETE_DEVICES, 'Only an Admin can delete a device.')

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getDevicesForDocument(documentId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from('document_devices')
    .select('device_id')
    .eq('document_id', documentId)

  if (error) throw error

  const ids = (data || []).map(row => row.device_id)
  if (ids.length === 0) return []

  const { data: devices, error: deviceError } = await supabase
    .from('devices')
    .select('*')
    .in('id', ids)
    .order('name', { ascending: true })

  if (deviceError) throw deviceError
  return (devices || []) as Device[]
}

// Document id -> its devices, for the documents table. Two plain reads keep
// this off the main documents query so pages still work before the migration.
export async function getDocumentDeviceMap(): Promise<Record<string, Device[]>> {
  const { data: links, error } = await supabase
    .from('document_devices')
    .select('document_id, device_id')

  if (error) throw error

  // Skip links whose document the user cannot open.
  const visibleIds = await getVisibleDocumentIds()
  const devices = await getDevices()
  const byId = new Map(devices.map(device => [device.id, device]))
  const map: Record<string, Device[]> = {}

  for (const row of links || []) {
    if (!visibleIds.has(row.document_id)) continue
    const device = byId.get(row.device_id)
    if (!device) continue
    if (!map[row.document_id]) map[row.document_id] = []
    map[row.document_id].push(device)
  }

  return map
}

// Sends only the difference, so existing links keep their own history.
export async function syncDocumentDevices(documentId: string, deviceIds: string[]): Promise<Device[]> {
  await requirePermission(PERMISSIONS.LINK_DEVICES, 'Your role cannot link devices to documents.')

  const { data: current, error: readError } = await supabase
    .from('document_devices')
    .select('device_id')
    .eq('document_id', documentId)

  if (readError) throw readError

  const currentIds = new Set((current || []).map(row => row.device_id))
  const wanted = new Set(deviceIds)

  const removed = [...currentIds].filter(id => !wanted.has(id))
  const added = [...wanted].filter(id => !currentIds.has(id))

  if (removed.length > 0) {
    const { error } = await supabase
      .from('document_devices')
      .delete()
      .eq('document_id', documentId)
      .in('device_id', removed)

    if (error) throw error
  }

  if (added.length > 0) {
    const { error } = await supabase
      .from('document_devices')
      .insert(added.map(device_id => ({ document_id: documentId, device_id })))

    if (error) throw error
  }

  return getDevicesForDocument(documentId)
}
