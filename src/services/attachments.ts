import { supabase } from '../lib/supabase'
import { ATTACHMENT_BUCKET, extractAttachments } from '../lib/attachments'
import type { DocumentAttachment } from '../types/database'

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  txt: ['text/plain'],
}

const KNOWN_MIME_TYPES = new Set(Object.values(MIME_BY_EXTENSION).flat())

// Anything that can run or render in the browser is refused before it can be
// served back to another user, whatever its declared type claims to be.
const DENIED_MIME_TYPES = new Set([
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/octet-stream/javascript',
  'application/exe',
  'application/x-msdownload',
  'application/x-sh',
  'application/x-shellscript',
  'application/java-archive',
  'application/vnd.android.package-archive',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
])

const DENIED_EXTENSIONS = [
  'svg', 'html', 'htm', 'xhtml', 'js', 'mjs', 'ts', 'jsx', 'tsx', 'json',
  'exe', 'dll', 'msi', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'lnk', 'scr',
  'jar', 'apk', 'zip', 'rar', '7z', 'tar', 'gz', 'iso', 'dmg',
  'php', 'asp', 'aspx', 'jsp', 'py', 'pl', 'rb',
]

// A query string, an uppercase suffix or a missing one must not decide the check.
export function getFileExtension(fileName: string): string {
  const clean = (fileName.split('?')[0].split('#')[0] || '').trim()
  const segment = clean.split('/').pop() || ''
  const dot = segment.lastIndexOf('.')
  if (dot <= 0) return ''
  return segment.slice(dot + 1).toLowerCase()
}

function getMimeType(file: File): string {
  return (file.type || '').split(';')[0].trim().toLowerCase()
}

// Returns null when the file may be stored, otherwise the operator-facing reason.
export function validateAttachmentFile(file: File): string | null {
  if (!file || file.size === 0) return 'Choose a file that is not empty.'

  if (file.size > ATTACHMENT_MAX_BYTES) {
    return `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Attachments are limited to 10 MB.`
  }

  const extension = getFileExtension(file.name)
  const mime = getMimeType(file)

  if (extension && DENIED_EXTENSIONS.includes(extension)) {
    return `.${extension} files cannot be attached. Use PDF, Word, Excel, image or plain text.`
  }
  if (mime && DENIED_MIME_TYPES.has(mime)) {
    return 'Scripts, web pages, images with code and archives cannot be attached.'
  }

  if (extension) {
    const accepted = MIME_BY_EXTENSION[extension]
    if (!accepted) {
      return `.${extension} files are not supported. Use PDF, Word, Excel, image or plain text.`
    }
    // octet-stream is what a browser sends when it cannot tell, so the
    // extension carries the decision; a real but mismatched type does not.
    if (mime && mime !== 'application/octet-stream' && !accepted.includes(mime)) {
      return `This file claims to be ${mime} but is named .${extension}.`
    }
    return null
  }

  if (mime && KNOWN_MIME_TYPES.has(mime)) return null
  return 'This file has no recognizable document, spreadsheet or image extension.'
}

export function attachmentFileName(file: File): string {
  return file.name.trim() || getFileExtension(file.name) || 'attachment'
}

// Keeps the current <user id>/<timestamp>_<code>.<ext> shape; only the
// characters that would break a path are replaced. A random part makes a retry
// of the same file land on a new path instead of colliding with a pending
// record somebody else may still hold. The folder is a label, never an
// authorization, so nothing here depends on it.
export function buildAttachmentPath(userId: string, code: string, fileName: string): string {
  const extension = getFileExtension(fileName)
  const safeCode = (code || 'document').toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const suffix = extension ? `.${extension}` : ''
  return `${userId}/${Date.now()}_${randomPathPart()}_${safeCode}${suffix}`
}

function randomPathPart(): string {
  const cryptoRandom = globalThis.crypto?.randomUUID?.()
  if (cryptoRandom) return cryptoRandom.slice(0, 8)
  return Math.random().toString(36).slice(2, 10)
}

// The registry only exists after the storage migration, so a missing
// relation or RPC means "not set up yet" instead of a raw database error.
export function isAttachmentsSchemaMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null
  const message = (err?.message || '').toLowerCase()
  return (
    err?.code === '42P01' ||
    err?.code === 'PGRST202' ||
    err?.code === '42883' ||
    message.includes('schema cache') ||
    message.includes('could not find the function') ||
    (message.includes('document_attachments') && message.includes('does not exist'))
  )
}

export const ATTACHMENTS_UNAVAILABLE_MESSAGE =
  'The attachment registry migration has not been applied yet, so files still use the previous storage rules. Apply the storage migration to protect them per document.'

export interface AttachmentTarget {
  documentId: string
  versionId?: string | null
}

async function callAttachmentRpc(functionName: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(functionName, args)
  if (error) throw error
  return data as string | null
}

export async function registerAttachment(
  target: AttachmentTarget,
  storagePath: string,
  fileName: string
): Promise<string> {
  const id = await callAttachmentRpc('begin_attachment_upload', {
    p_document_id: target.documentId,
    p_version_id: target.versionId ?? null,
    p_bucket_id: ATTACHMENT_BUCKET,
    p_storage_path: storagePath,
    p_file_name: fileName,
  })
  if (!id) throw new Error('The attachment could not be registered.')
  return id
}

export async function confirmAttachment(attachmentId: string): Promise<void> {
  await callAttachmentRpc('complete_attachment_upload', { p_attachment_id: attachmentId })
}

// Re-confirms a pending record whose file really landed. Meant for the
// reconciliation an Admin or the original uploader runs after a completion
// that failed for some other reason.
export async function reconcileAttachment(attachmentId: string): Promise<void> {
  await callAttachmentRpc('reconcile_attachment_upload', { p_attachment_id: attachmentId })
}

// Discarding a pending record never touches Storage. It reports why it could
// not discard instead of failing quietly: a leftover pending row is invisible
// to everyone except an Admin unless the caller is told.
export async function abandonAttachment(attachmentId: string): Promise<string | null> {
  const { error } = await supabase.rpc('cancel_attachment_upload', { p_attachment_id: attachmentId })
  if (!error) return null
  // A registry that is not set up yet has nothing to clean up.
  if (isAttachmentsSchemaMissing(error)) return null
  return error.message
}

// The pending registry row is what authorizes this write.
export async function uploadToRegisteredPath(file: File, storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(storagePath, file, { upsert: false })
  if (error) throw error
}

function reasonOf(err: unknown): string {
  return (err as Error)?.message || 'The operation failed.'
}

// A pending record that could not be discarded is a fact the user has to hear,
// not something to swallow.
function withDiscardProblem(err: unknown, discardProblem: string | null): Error {
  if (!discardProblem) return new Error(reasonOf(err))
  return new Error(
    `${reasonOf(err)} The pending record was kept because it could not be discarded: ${discardProblem}`
  )
}

// Order that cannot leave a file nobody can reach: the pending row authorizes
// the upload, the confirmation proves the bytes and the uploader, and only then
// is a marker written into the document. If that last write fails the file stays
// registered and downloadable - visible to whoever may see the document and
// removable through the Admin cleanup queue - instead of becoming a marker that
// points at a record nobody has.
// Returns a notice when the registry migration is not applied yet.
export async function storeAttachment(
  file: File,
  storagePath: string,
  target: AttachmentTarget,
  afterUpload: () => Promise<unknown>
): Promise<string | null> {
  let attachmentId: string
  try {
    attachmentId = await registerAttachment(target, storagePath, attachmentFileName(file))
  } catch (err) {
    if (!isAttachmentsSchemaMissing(err)) throw err
    await uploadToRegisteredPath(file, storagePath)
    await afterUpload()
    return ATTACHMENTS_UNAVAILABLE_MESSAGE
  }

  try {
    await uploadToRegisteredPath(file, storagePath)
  } catch (err) {
    throw withDiscardProblem(err, await abandonAttachment(attachmentId))
  }

  try {
    await confirmAttachment(attachmentId)
  } catch (err) {
    const discardProblem = await abandonAttachment(attachmentId)
    if (discardProblem) {
      // The bytes are in the bucket, so the record is kept for reconciliation
      // rather than abandoned and the file left with nothing pointing at it.
      throw new Error(
        `${reasonOf(err)} The file is stored, so its pending record was kept. ` +
        `Reconcile it, or queue it for Admin cleanup.`
      )
    }
    throw err
  }

  try {
    await afterUpload()
  } catch (err) {
    throw new Error(
      `The file is stored and attached, but the document text was not updated: ${reasonOf(err)}. ` +
      `The attachment stays recorded and can be removed through the Admin cleanup queue.`
    )
  }
  return null
}

// A staged revision may not expose its file on the live document, so the
// upload is authorized by a temporary document-level row that is retired once
// the version-scoped association exists.
export async function storeAttachmentForRevision(
  file: File,
  storagePath: string,
  documentId: string,
  createRevision: () => Promise<string | null>
): Promise<string | null> {
  let stagingId: string
  try {
    stagingId = await registerAttachment({ documentId }, storagePath, attachmentFileName(file))
  } catch (err) {
    if (!isAttachmentsSchemaMissing(err)) throw err
    await uploadToRegisteredPath(file, storagePath)
    await createRevision()
    return ATTACHMENTS_UNAVAILABLE_MESSAGE
  }

  try {
    await uploadToRegisteredPath(file, storagePath)
  } catch (err) {
    throw withDiscardProblem(err, await abandonAttachment(stagingId))
  }

  try {
    await confirmAttachment(stagingId)
  } catch (err) {
    const discardProblem = await abandonAttachment(stagingId)
    if (discardProblem) {
      throw new Error(
        `${reasonOf(err)} The file is stored, so its pending record was kept. ` +
        `Reconcile it, or queue it for Admin cleanup.`
      )
    }
    throw err
  }

  // From here the file is a real attachment, so a later failure is reported
  // instead of rolling the record back behind the user's back.
  const versionId = await createRevision().catch(err => {
    throw new Error(
      `The file is stored and attached, but the new version was not created: ${reasonOf(err)}. ` +
      `The attachment stays recorded and can be removed through the Admin cleanup queue.`
    )
  })
  if (!versionId) {
    throw new Error(
      `The file is stored and attached, but the new version was not recorded. ` +
      `The attachment stays recorded and can be removed through the Admin cleanup queue.`
    )
  }

  await linkExistingAttachment({ documentId, versionId }, storagePath, attachmentFileName(file))

  const retired = await retireStagingAttachment(stagingId)
  return retired
}

// The document-level pointer only ever existed to authorize the upload. Losing
// it means the staged file still shows on the live document, so the caller has
// to be told rather than left believing the revision is private.
async function retireStagingAttachment(stagingId: string): Promise<string | null> {
  const { error } = await supabase.rpc('retire_staging_attachment', { p_attachment_id: stagingId })
  if (!error) return null
  if (isAttachmentsSchemaMissing(error)) return null
  return (
    `The new version carries the file, but its temporary document-level record could not be removed: ` +
    `${error.message}. The file may appear on the live document until that record is cleared.`
  )
}

// Reusing a stored file in a new version: register and confirm, no upload, so
// several versions can share one physical object.
export async function linkExistingAttachment(
  target: AttachmentTarget,
  storagePath: string,
  fileName?: string | null
): Promise<void> {
  const attachmentId = await registerAttachment(target, storagePath, fileName || '')
  try {
    await confirmAttachment(attachmentId)
  } catch (err) {
    // A link that could not be confirmed would sit pending forever, so discard
    // it - but say so if the record survives.
    throw withDiscardProblem(err, await abandonAttachment(attachmentId))
  }
}

// A new version that carries an older version's files shares the stored objects;
// only new associations are written. Returns the paths it could not associate.
export async function copyVersionAttachments(
  documentId: string,
  sourceVersionId: string,
  targetVersionId: string,
  fallback?: { path: string; fileName?: string | null } | null
): Promise<{ failures: string[]; unavailable: boolean }> {
  let registry: DocumentAttachment[]
  try {
    registry = await listDocumentAttachments(documentId)
  } catch (err) {
    if (isAttachmentsSchemaMissing(err)) return { failures: [], unavailable: true }
    throw err
  }

  const sources: { path: string; fileName?: string | null }[] = registry
    .filter(a => a.version_id === sourceVersionId)
    .map(a => ({ path: a.storage_path, fileName: a.file_name }))

  if (fallback?.path && !sources.some(s => s.path === fallback.path)) {
    sources.push({ path: fallback.path, fileName: fallback.fileName })
  }

  const failures: string[] = []
  for (const source of sources) {
    try {
      await linkExistingAttachment({ documentId, versionId: targetVersionId }, source.path, source.fileName)
    } catch (err) {
      if (isAttachmentsSchemaMissing(err)) return { failures: [], unavailable: true }
      console.error('Failed to associate attachment with the new version:', err)
      failures.push(source.path)
    }
  }
  return { failures, unavailable: false }
}

export interface AttachmentRecord {
  id: string
  storage_path: string
  status: string
}

// A cleanup request is made against a registered attachment, so the record id
// is needed and not just the path.
export async function listDocumentAttachmentRecords(documentId: string): Promise<AttachmentRecord[]> {
  const { data, error } = await supabase
    .from('document_attachments')
    .select('id, storage_path, status')
    .eq('document_id', documentId)

  if (error) throw error
  return (data || []) as AttachmentRecord[]
}

export async function listAttachmentPathsOutsideDocument(documentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('document_attachments')
    .select('storage_path')
    .neq('document_id', documentId)

  if (error) throw error
  return (data || []).map(row => row.storage_path as string)
}

// True when the object is in the bucket, false when it is not, null when the
// caller may not ask. Needed after a cleanup: with its association gone the
// file is invisible to Storage SELECT, so an honest yes/no has to come from the
// Admin-gated function instead.
export async function isAttachmentFilePresent(storagePath: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('attachment_file_present', {
    p_bucket_id: ATTACHMENT_BUCKET,
    p_storage_path: storagePath,
  })
  if (error) {
    if (isAttachmentsSchemaMissing(error)) return null
    throw error
  }
  return data === true ? true : data === false ? false : null
}

export async function listDocumentAttachments(documentId: string): Promise<DocumentAttachment[]> {
  const { data, error } = await supabase
    .from('document_attachments')
    .select('*')
    .eq('document_id', documentId)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as DocumentAttachment[]
}

export interface AttachmentDownload {
  path: string
  fileName: string
  // Which registry row made this file downloadable here. Absent for legacy
  // content markers, which carry no association at all.
  scope?: 'document' | 'version'
}

function toDownload(attachment: DocumentAttachment): AttachmentDownload {
  return {
    path: attachment.storage_path,
    fileName: attachment.file_name || attachment.storage_path.split('/').pop() || attachment.storage_path,
    scope: attachment.version_id === null ? 'document' : 'version',
  }
}

export interface AttachmentCleanupRequest {
  request_id: string
  storage_path: string
  status: 'queued' | 'removed' | 'failed'
  requested_at: string
  last_error: string | null
}

// Admin-only: the authorization that lets a Storage DELETE through. Without it
// the file stays, even for an Admin.
export async function requestAttachmentCleanup(attachmentId: string): Promise<string> {
  const id = await callAttachmentRpc('request_attachment_cleanup', { p_attachment_id: attachmentId })
  if (!id) throw new Error('The file could not be queued for cleanup.')
  return id
}

export async function listAttachmentCleanupRequests(): Promise<AttachmentCleanupRequest[]> {
  const { data, error } = await supabase.rpc('list_attachment_cleanup_requests')
  if (error) {
    if (isAttachmentsSchemaMissing(error)) return []
    throw error
  }
  return (data || []) as AttachmentCleanupRequest[]
}

// Records the outcome so a failed cleanup stays visible and retryable.
export async function resolveAttachmentCleanup(
  requestId: string,
  succeeded: boolean,
  lastError?: string | null
): Promise<void> {
  const { error } = await supabase.rpc('resolve_attachment_cleanup', {
    p_request_id: requestId,
    p_succeeded: succeeded,
    p_error: lastError ?? null,
  })
  if (error && !isAttachmentsSchemaMissing(error)) throw error
}

export interface StalePendingUpload {
  attachment_id: string
  document_id: string
  storage_path: string
  uploaded_by: string | null
  created_at: string
  file_exists: boolean
}

// Admin inspection of pending records left behind by an interrupted upload.
export async function listStalePendingUploads(olderThan = '01:00:00'): Promise<StalePendingUpload[]> {
  const { data, error } = await supabase.rpc('list_stale_pending_uploads', { p_older_than: olderThan })
  if (error) {
    if (isAttachmentsSchemaMissing(error)) return []
    throw error
  }
  return (data || []) as StalePendingUpload[]
}

// Clears pending records whose file never arrived. Files that did arrive are
// left for reconciliation, and no Storage object is deleted here.
export async function purgeStalePendingUploads(olderThan = '01:00:00'): Promise<number> {
  const { data, error } = await supabase.rpc('purge_stale_pending_uploads', { p_older_than: olderThan })
  if (error) throw error
  return Number(data ?? 0)
}

// Registry rows never inherit: the live document page shows the document's own
// associations plus the ones belonging to the version that is currently
// active, and nothing from any other revision.
export function selectDocumentAttachments(
  registry: DocumentAttachment[],
  currentVersionId?: string | null
): AttachmentDownload[] {
  const seen = new Set<string>()
  const result: AttachmentDownload[] = []

  for (const attachment of registry) {
    if (attachment.status !== 'available') continue
    const belongs =
      attachment.version_id === null ||
      (currentVersionId != null && attachment.version_id === currentVersionId)
    if (!belongs || seen.has(attachment.storage_path)) continue
    seen.add(attachment.storage_path)
    result.push(toDownload(attachment))
  }
  return result
}

export function selectVersionAttachments(
  registry: DocumentAttachment[],
  versionId: string
): AttachmentDownload[] {
  const seen = new Set<string>()
  const result: AttachmentDownload[] = []

  for (const attachment of registry) {
    if (attachment.status !== 'available') continue
    if (attachment.version_id !== versionId) continue
    if (seen.has(attachment.storage_path)) continue
    seen.add(attachment.storage_path)
    result.push(toDownload(attachment))
  }
  return result
}

// Legacy display for the state before the registry migration: content markers
// are shown, but they authorize nothing on their own.
export function legacyAttachments(content: string | null): AttachmentDownload[] {
  return extractAttachments(content)
}
