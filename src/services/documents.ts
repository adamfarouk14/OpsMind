import { supabase } from '../lib/supabase'
import { ATTACHMENT_BUCKET, collectAttachmentPaths } from '../lib/attachments'
import { isVersionNewer } from '../lib/versions'
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

export async function deleteDocument(id: string): Promise<{ remainingFiles: string[] }> {
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

  const candidates = collectAttachmentPaths([doc, ...(versions ?? [])])

  // Delete the row first (versions cascade); storage cleanup after, so a
  // failed cleanup can never orphan files against a still-live document.
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
  if (deleteError) throw deleteError

  if (candidates.length === 0) return { remainingFiles: [] }

  const [{ data: otherDocs }, { data: otherVersions }] = await Promise.all([
    supabase.from('documents').select('content').neq('id', id),
    supabase.from('document_versions').select('content, file_path').neq('document_id', id),
  ])
  const otherRecords: { content?: string | null; file_path?: string | null }[] =
    [...(otherDocs ?? []), ...(otherVersions ?? [])]
  const referencedPaths = new Set(collectAttachmentPaths(otherRecords))

  // Files still referenced by any readable document/version are kept on purpose.
  const deletable = candidates.filter(
    p => !referencedPaths.has(p) && !otherRecords.some(r => (r.content ?? '').includes(p) || (r.file_path ?? '').includes(p))
  )
  if (deletable.length === 0) return { remainingFiles: [] }

  const { error: removeError } = await supabase.storage.from(ATTACHMENT_BUCKET).remove(deletable)
  if (removeError) return { remainingFiles: deletable }

  const checks = await Promise.all(
    deletable.map(async p => {
      try {
        const { data } = await supabase.storage.from(ATTACHMENT_BUCKET).exists(p)
        // exists() reports a missing file as {data:false, error}; only a
        // confirmed-still-present object counts as remaining.
        if (data === true) return 'remaining' as const
        if (data === false) return 'gone' as const
        return 'unknown' as const
      } catch {
        return 'unknown' as const
      }
    })
  )
  if (checks.some(c => c === 'unknown')) return { remainingFiles: deletable }
  return { remainingFiles: deletable.filter((_, i) => checks[i] === 'remaining') }
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