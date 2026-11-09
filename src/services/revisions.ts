import { supabase } from '../lib/supabase'
import { isVersionNewer } from '../lib/versions'
import { PERMISSIONS, canReviewRecord, type Permission } from '../lib/permissions'
import { requirePermission, type Actor } from '../lib/session'
import type { DocType } from '../types/database'

// A revision is a document_versions row holding a proposed snapshot of the
// document. While status is 'In Review' the live documents row is untouched,
// so users keep seeing the last approved version until an Admin approves it.

export interface RevisionCandidate {
  id: string
  document_id: string
  version: string
  notes: string | null
  created_at: string
  title: string | null
  description: string | null
  content: string | null
  type: string | null
  tags: string[] | null
  status: string | null
  file_path: string | null
  file_name: string | null
  author_id: string | null
  users?: { name: string } | null
  document?: {
    id: string
    title: string
    code: string
    type: string
    version: string
    status: string
    description: string | null
    owner_id: string | null
  } | null
}

const REVISION_SELECT = `
  id,
  document_id,
  version,
  notes,
  created_at,
  title,
  description,
  content,
  type,
  tags,
  status,
  file_path,
  file_name,
  author_id,
  users:author_id ( name ),
  document:documents ( id, title, code, type, version, status, description, owner_id )
`

export async function getPendingRevisions(): Promise<RevisionCandidate[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select(REVISION_SELECT)
    .eq('status', 'In Review')
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as unknown as RevisionCandidate[]
  // A revision older than what the document already publishes can never be
  // published — approving it would roll the document back.
  return rows.filter(rev => rev.document && isVersionNewer(rev.version, rev.document.version))
}

export function findPendingRevision<T extends { version: string; status?: string | null }>(
  versions: T[] | undefined,
  liveVersion: string
): T | undefined {
  return versions?.find(v => v.status === 'In Review' && isVersionNewer(v.version, liveVersion))
}

export interface RevisionDecision {
  success: true
  notificationWarning?: string
}

// Publishing a revision is an approval: the role must allow it, and the
// reviewer can be neither the author of the revision nor the document owner.
async function assertRevisionReviewer(
  rev: RevisionCandidate,
  permission: Permission,
  verb: string,
): Promise<Actor> {
  const actor = await requirePermission(permission, `Only Managers and Administrators can ${verb} revisions.`)

  if (!canReviewRecord(
    { role: actor.role, id: actor.id },
    { owner_id: rev.document?.owner_id, author_id: rev.author_id },
  )) {
    throw new Error('You cannot review your own submission. Another reviewer must decide.')
  }

  return actor
}

export async function approveRevision(
  revisionId: string,
  remarks?: string
): Promise<RevisionDecision> {
  const { data: revision, error: readError } = await supabase
    .from('document_versions')
    .select(REVISION_SELECT)
    .eq('id', revisionId)
    .single()

  if (readError) throw new Error(`Revision lookup failed: ${readError.message}`)

  const rev = revision as unknown as RevisionCandidate
  const document = rev.document
  if (!document) throw new Error('Revision has no parent document.')

  await assertRevisionReviewer(rev, PERMISSIONS.APPROVE_DOCUMENTS, 'approve')

  if (rev.title === null && rev.content === null && rev.description === null) {
    throw new Error('This revision has no content snapshot and cannot be published.')
  }

  // Mark the revision approved first; if the promotion fails we restore 'In Review'.
  const { error: markError } = await supabase
    .from('document_versions')
    .update({ status: 'Approved', notes: remarks?.trim() || rev.notes })
    .eq('id', revisionId)

  if (markError) throw new Error(`Failed to mark revision approved: ${markError.message}`)

  const { error: promoteError } = await supabase
    .from('documents')
    .update({
      title: rev.title ?? document.title,
      description: rev.description ?? document.description,
      content: rev.content,
      type: (rev.type ?? document.type) as DocType,
      tags: rev.tags ?? [],
      version: rev.version,
    })
    .eq('id', document.id)

  if (promoteError) {
    const { error: restoreError } = await supabase
      .from('document_versions')
      .update({ status: 'In Review' })
      .eq('id', revisionId)
    if (restoreError) {
      console.error(
        `[revisions] Could not restore revision ${revisionId} to In Review after promotion failed. ` +
        `Manual correction may be needed. Error: ${restoreError.message}`
      )
    }
    throw new Error(`Failed to publish revision: ${promoteError.message}`)
  }

  let notificationWarning: string | undefined
  if (document.owner_id) {
    const { error: notifyError } = await supabase.from('notifications').insert({
      user_id: document.owner_id,
      type: 'approval',
      title: 'Revision Approved',
      message: `Revision ${rev.version} of "${document.title}" has been published.${remarks ? ` Remarks: ${remarks}` : ''}`,
      document_id: document.id,
      is_read: false,
    })
    if (notifyError) notificationWarning = `Revision published, but owner notification failed: ${notifyError.message}`
  }

  return { success: true, ...(notificationWarning ? { notificationWarning } : {}) }
}

export async function rejectRevision(
  revisionId: string,
  remarks?: string
): Promise<RevisionDecision> {
  const { data: revision, error: readError } = await supabase
    .from('document_versions')
    .select(REVISION_SELECT)
    .eq('id', revisionId)
    .single()

  if (readError) throw new Error(`Revision lookup failed: ${readError.message}`)

  const rev = revision as unknown as RevisionCandidate
  const document = rev.document
  if (!document) throw new Error('Revision has no parent document.')

  await assertRevisionReviewer(rev, PERMISSIONS.REJECT_DOCUMENTS, 'reject')

  const { error: markError } = await supabase
    .from('document_versions')
    .update({ status: 'Rejected', notes: remarks?.trim() || rev.notes })
    .eq('id', revisionId)

  if (markError) throw new Error(`Failed to reject revision: ${markError.message}`)

  // The live documents row is deliberately left untouched — rejection never publishes.

  let notificationWarning: string | undefined
  if (document.owner_id) {
    const { error: notifyError } = await supabase.from('notifications').insert({
      user_id: document.owner_id,
      type: 'rejection',
      title: 'Revision Rejected',
      message: `Revision ${rev.version} of "${document.title}" was rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      document_id: document.id,
      is_read: false,
    })
    if (notifyError) notificationWarning = `Rejection saved, but owner notification failed: ${notifyError.message}`
  }

  return { success: true, ...(notificationWarning ? { notificationWarning } : {}) }
}
