import { supabase } from '../lib/supabase'
import { ATTACHMENT_BUCKET, collectAttachmentPaths } from '../lib/attachments'
import {
  ATTACHMENTS_UNAVAILABLE_MESSAGE,
  copyVersionAttachments,
  isAttachmentsSchemaMissing,
  isAttachmentFilePresent,
  listAttachmentPathsOutsideDocument,
  listDocumentAttachmentRecords,
  requestAttachmentCleanup,
  resolveAttachmentCleanup,
  type AttachmentRecord,
} from './attachments'
import { findPendingRevision } from './revisions'
import { isVersionNewer, nextVersionStamp } from '../lib/versions'
import { PERMISSIONS, canEditRecord } from '../lib/permissions'
import { getActor, requirePermission } from '../lib/session'
import type { DocType, DocStatus, DocumentWithOwner, DocumentWithVersions, DocumentWithApprovals } from '../types/database'

// Access control:
// Admin/Manager can see all document statuses.
// Support Agents can only see Approved documents.
// RLS on the database enforces the same rules server-side.
const ELEVATED_ROLES = ['Admin', 'Manager'] as const

async function isElevatedRole(): Promise<boolean> {
  const { role } = await getActor()
  return ELEVATED_ROLES.includes(role as any)
}

export async function getDocuments(): Promise<DocumentWithOwner[]> {
  const elevated = await isElevatedRole()

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
    .order('updated_at', { ascending: false })

  if (!elevated) {
    query = query.eq('status', 'Approved') as any
  }

  const { data, error } = await query
  if (error) throw error
  return data as DocumentWithOwner[]
}

export async function getDocumentById(id: string): Promise<DocumentWithVersions & DocumentWithApprovals> {
  const { role } = await getActor()
  const isElevated = ELEVATED_ROLES.includes(role as any)

  let baseQuery = supabase
    .from('documents')
    .select(`
      *,
      users:owner_id (
        name,
        initials,
        avatar_color
      )
    `)
    .eq('id', id)

  if (!isElevated) {
    baseQuery = baseQuery.eq('status', 'Approved') as any
  }

  const { data, error } = await baseQuery.single()

  if (error) throw error

  const { data: versions } = await supabase
    .from('document_versions')
    .select(`
      *,
      users:author_id (
        name,
        initials,
        avatar_color
      )
    `)
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: true })

  return {
    ...data,
    versions: versions || [],
    approvals: approvals || [],
  } as DocumentWithVersions & DocumentWithApprovals
}

export async function createDocument(document: {
  title: string
  code: string
  type: DocType
  version: string
  description: string
  content: string
  tags: string[]
  status: DocStatus
  owner_id: string
}) {
  const actor = await requirePermission(PERMISSIONS.CREATE_DOCUMENTS, 'Your role cannot create documents.')
  if (actor.id !== document.owner_id) {
    throw new Error('Documents must be created under your own account.')
  }

  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDocument(id: string, updates: {
  title?: string
  code?: string
  type?: DocType
  version?: string
  description?: string
  content?: string
  tags?: string[]
  status?: DocStatus
}) {
  const actor = await getActor()
  const { data: existing, error: readError } = await supabase
    .from('documents')
    .select('id, owner_id')
    .eq('id', id)
    .single()
  if (readError) throw new Error(`Document lookup failed: ${readError.message}`)

  if (!canEditRecord({ role: actor.role, id: actor.id }, existing.owner_id)) {
    throw new Error('You can only edit documents you own.')
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface DocumentDeletionResult {
  remainingFiles: string[]
  keptFiles: { path: string; reason: string }[]
}

// Removing a document never deletes a file another document still uses, and no
// file leaves the bucket without a queued cleanup authorization.
export async function deleteDocument(id: string): Promise<DocumentDeletionResult> {
  await requirePermission(
    PERMISSIONS.HARD_DELETE_DOCUMENTS,
    'Only an Admin can delete a document.'
  )

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('content')
    .eq('id', id)
    .single()
  if (docError) throw docError

  const { data: versions } = await supabase
    .from('document_versions')
    .select('content, file_path')
    .eq('document_id', id)

  // The registry is the only thing that can authorize removing a file, so its
  // records (not just their paths) are collected first. Content markers remain
  // the fallback only while the storage migration is unapplied - and in that
  // state no cleanup can be authorized at all.
  let records: AttachmentRecord[] = []
  let registryUsed = false
  try {
    records = await listDocumentAttachmentRecords(id)
    registryUsed = true
  } catch (err) {
    if (!isAttachmentsSchemaMissing(err)) throw err
  }

  const candidates = registryUsed
    ? [...new Set(records.map(record => record.storage_path))]
    : collectAttachmentPaths([doc, ...(versions ?? [])])

  const referencedElsewhere = new Set<string>()
  if (registryUsed) {
    for (const path of await listAttachmentPathsOutsideDocument(id)) {
      referencedElsewhere.add(path)
    }
  }

  const [{ data: otherDocs }, { data: otherVersions }] = await Promise.all([
    supabase.from('documents').select('content').neq('id', id),
    supabase.from('document_versions').select('content, file_path').neq('document_id', id),
  ])
  const otherRecords: { content?: string | null; file_path?: string | null }[] =
    [...(otherDocs ?? []), ...(otherVersions ?? [])]
  for (const path of collectAttachmentPaths(otherRecords)) referencedElsewhere.add(path)
  for (const record of otherRecords) {
    for (const path of candidates) {
      if ((record.content ?? '').includes(path) || (record.file_path ?? '').includes(path)) {
        referencedElsewhere.add(path)
      }
    }
  }

  const keptFiles: { path: string; reason: string }[] = []
  const queued: { path: string; requestId: string }[] = []

  for (const path of candidates) {
    if (referencedElsewhere.has(path)) {
      keptFiles.push({ path, reason: 'another document or version still uses this file' })
      continue
    }
    const record = records.find(row => row.storage_path === path)
    if (!registryUsed || !record) {
      // No registry record means no authorization, so the file stays: unlisted
      // and orphaned objects are never removed as a side effect of this flow.
      keptFiles.push({
        path,
        reason: registryUsed
          ? 'it has no attachment record, so no cleanup could be authorized'
          : 'the attachment registry is not available, so no cleanup could be authorized',
      })
      continue
    }
    try {
      queued.push({ path, requestId: await requestAttachmentCleanup(record.id) })
    } catch (err) {
      keptFiles.push({ path, reason: `cleanup could not be authorized: ${(err as Error).message}` })
    }
  }

  // The row goes first (versions and registry records cascade with it) and the
  // cleanup requests outlive that cascade, so a failed removal can never orphan
  // files against a live document and can still be retried later.
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
  if (deleteError) {
    throw new Error(
      `${deleteError.message} ${queued.length} file(s) stay queued for cleanup; retrying this deletion reuses those requests.`
    )
  }

  if (queued.length === 0) return { remainingFiles: [], keptFiles }

  const paths = queued.map(item => item.path)
  const { error: removeError } = await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths)
  const detail = removeError?.message ?? 'The file is still in storage.'

  const checks = await Promise.all(
    paths.map(async path => {
      const present = await isAttachmentFilePresent(path)
      // An Admin-only answer is the only reliable proof left; when it is
      // unavailable the removal result decides.
      if (present !== null) return present ? 'remaining' as const : 'gone' as const
      return removeError ? ('remaining' as const) : ('gone' as const)
    })
  )

  // Recording each outcome keeps a failed cleanup visible and retryable.
  await Promise.all(
    queued.map(async (item, index) => {
      try {
        await resolveAttachmentCleanup(item.requestId, checks[index] === 'gone',
          checks[index] === 'gone' ? null : detail)
      } catch (err) {
        console.error('Cleanup request outcome could not be recorded:', err)
      }
    })
  )

  return { remainingFiles: paths.filter((_, index) => checks[index] !== 'gone'), keptFiles }
}

export async function createDocumentVersion(documentId: string, version: {
  version: string
  author_id: string
  notes: string
  title?: string | null
  description?: string | null
  content?: string | null
  type?: string | null
  status?: string | null
  tags?: string[] | null
  file_path?: string | null
  file_name?: string | null
}) {
  const actor = await requirePermission(PERMISSIONS.CREATE_VERSION, 'Your role cannot create document versions.')
  if (version.author_id !== actor.id) {
    throw new Error('Versions must be authored under your own account.')
  }

  const [{ data: existingVersions }, { data: liveDoc }] = await Promise.all([
    supabase.from('document_versions').select('version').eq('document_id', documentId),
    supabase.from('documents').select('version').eq('id', documentId).single(),
  ])

  // The first snapshot of a new document intentionally shares the document's own
  // version number, so ordering rules only apply once history exists.
  if ((existingVersions ?? []).length > 0) {
    const taken = new Set(
      [...(existingVersions ?? []).map(v => v.version), liveDoc?.version].filter(Boolean) as string[]
    )
    if (taken.has(version.version)) {
      throw new Error(`Version ${version.version} already exists for this document`)
    }
    if (liveDoc?.version && !isVersionNewer(version.version, liveDoc.version)) {
      throw new Error(`Version ${version.version} must be higher than the current version ${liveDoc.version}`)
    }
  }

  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      ...version,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export interface RestoreResult {
  version: string
  versionId: string
  staged: boolean
  notice: string | null
}

// Bringing an old snapshot back never rewrites history. The chosen version is
// copied forward into a new, higher-numbered revision and its files are
// re-associated with that revision, so no object is uploaded twice and no
// earlier record is altered.
export async function restoreDocumentVersion(
  documentId: string,
  versionId: string,
  notes?: string
): Promise<RestoreResult> {
  const actor = await requirePermission(
    PERMISSIONS.CREATE_VERSION,
    'Your role cannot create document versions.'
  )

  const [{ data: liveDoc, error: liveError }, { data: history, error: historyError }] = await Promise.all([
    supabase
      .from('documents')
      .select('title, code, type, version, description, content, tags, status, owner_id')
      .eq('id', documentId)
      .single(),
    supabase.from('document_versions').select('*').eq('document_id', documentId),
  ])
  if (liveError) throw liveError
  if (historyError) throw historyError

  const versions = history ?? []
  const source = versions.find(v => v.id === versionId)
  if (!source) throw new Error('The version to restore was not found, or is not visible to you.')

  if (source.content == null && source.title == null && source.description == null) {
    throw new Error('That version has no recorded content snapshot, so there is nothing to restore.')
  }

  // Mirrors the document write rule: elevated roles restore anything, an agent
  // only its own document while it is still unpublished.
  const elevated = ELEVATED_ROLES.includes(actor.role as any)
  if (!elevated && (liveDoc.owner_id !== actor.id || liveDoc.status === 'Approved')) {
    throw new Error('You can only restore versions of your own document while it has not been published.')
  }

  const pending = findPendingRevision(versions, liveDoc.version)
  if (pending) {
    throw new Error(`Revision ${pending.version} is already awaiting approval. Decide it before restoring a version.`)
  }

  // Higher than every number this document has ever used, history included.
  const target = nextVersionStamp([liveDoc.version, ...versions.map(v => v.version)])
  const content = source.content ?? ''

  const created = await createDocumentVersion(documentId, {
    version: target,
    author_id: actor.id,
    notes: notes?.trim() || `Restored from ${source.version}`,
    title: source.title,
    description: source.description,
    content,
    type: source.type,
    // A published document only changes through approval; a draft is restored at once.
    status: liveDoc.status === 'Approved' ? 'In Review' : liveDoc.status,
    tags: source.tags,
    file_path: source.file_path,
    file_name: source.file_name,
  })

  // The live row is left alone while the restored revision is awaiting its decision.
  let staged = false
  if (liveDoc.status === 'Approved') {
    staged = true
  } else {
    await updateDocument(documentId, {
      title: source.title ?? liveDoc.title,
      code: liveDoc.code,
      type: (source.type ?? liveDoc.type) as DocType,
      version: target,
      description: source.description ?? liveDoc.description,
      content,
      tags: source.tags ?? liveDoc.tags,
    })
  }

  let notice: string | null = null
  const { failures, unavailable } = await copyVersionAttachments(
    documentId,
    versionId,
    created.id,
    source.file_path ? { path: source.file_path, fileName: source.file_name } : null
  )
  if (unavailable) {
    notice = ATTACHMENTS_UNAVAILABLE_MESSAGE
  } else if (failures.length > 0) {
    notice =
      `The restored revision was recorded, but ${failures.length} file(s) could not be associated with it ` +
      `(only the account that uploaded a file may claim it). The files themselves are untouched.`
  }

  return {
    version: target,
    versionId: created.id,
    staged,
    notice,
  }
}

export async function getDocumentsByType(type: DocType): Promise<DocumentWithOwner[]> {
  const elevated = await isElevatedRole()

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
    .eq('type', type)
    .order('updated_at', { ascending: false })

  if (!elevated) {
    query = query.eq('status', 'Approved') as any
  }

  const { data, error } = await query
  if (error) throw error
  return data as DocumentWithOwner[]
}

export async function getDocumentsByStatus(status: DocStatus): Promise<DocumentWithOwner[]> {
  // Support Agents are locked to Approved — return empty for other statuses
  const role = await getActor()
  if (!ELEVATED_ROLES.includes(role.role as any) && status !== 'Approved') return []

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      users:owner_id (
        name,
        initials,
        avatar_color
      )
    `)
    .eq('status', status)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as DocumentWithOwner[]
}

export async function searchDocuments(query: string): Promise<DocumentWithOwner[]> {
  const elevated = await isElevatedRole()
  console.log('[searchDocuments] Role check:', { elevated })

  let baseQuery = supabase
    .from('documents')
    .select(`
      *,
      users:owner_id (
        name,
        initials,
        avatar_color
      )
    `)
    .or(`title.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (!elevated) {
    baseQuery = baseQuery.eq('status', 'Approved') as any
    console.log('[searchDocuments] Non-elevated role: filtering to Approved only')
  } else {
    console.log('[searchDocuments] Elevated role: showing all statuses')
  }

  const { data, error } = await baseQuery
  
  if (error) {
    console.error('[searchDocuments] Query error:', error)
    throw error
  }
  
  console.log('[searchDocuments] Results:', data?.length || 0)
  return data as DocumentWithOwner[]
}