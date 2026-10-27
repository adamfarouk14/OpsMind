import { supabase } from '../lib/supabase'
import type { ApprovalStatus, DocumentWithOwner } from '../types/database'

export interface ApprovalResult {
  success: true
  notificationWarning?: string
}

// Snapshot of an existing approval row used for compensating rollback.
interface ApprovalSnapshot {
  id: string
  status: ApprovalStatus
  approver_id: string | null
  date: string | null
  notes: string | null
}

export async function getPendingApprovals(): Promise<DocumentWithOwner[]> {
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
    .eq('status', 'In Review')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as DocumentWithOwner[]
}

// Returns a warning string if the notification failed, null if it succeeded.
async function tryInsertNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  documentId: string
): Promise<string | null> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    document_id: documentId,
    is_read: false,
  })
  if (error) {
    console.error('Notification insert failed:', error.message)
    return error.message
  }
  return null
}

// Reads the current approval row for a document.
// Returns exists:false when the row doesn't exist yet ,
// throws on any real DB error so callers don't silently skip to insert.
async function readApprovalRow(
  documentId: string
): Promise<{ snapshot: ApprovalSnapshot; exists: true } | { snapshot: null; exists: false }> {
  const { data, error } = await supabase
    .from('approvals')
    .select('id, status, approver_id, date, notes')
    .eq('document_id', documentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { snapshot: null, exists: false } // no rows
    throw new Error(`Approval record lookup failed: ${error.message}`)
  }

  return { snapshot: data as ApprovalSnapshot, exists: true }
}

// Best-effort rollback — restores the approval row to its previous values.
// Logs on failure but doesn't throw, so the original error can propagate.
async function rollbackApprovalRow(snapshot: ApprovalSnapshot): Promise<void> {
  const { error } = await supabase
    .from('approvals')
    .update({
      status: snapshot.status,
      approver_id: snapshot.approver_id,
      date: snapshot.date,
      notes: snapshot.notes,
    })
    .eq('id', snapshot.id)

  if (error) {
    console.error(
      `[approvals] Rollback failed for approval ${snapshot.id} (document_id implied). ` +
      `Manual correction may be needed. Error: ${error.message}`
    )
  }
}

export async function approveDocument(
  documentId: string,
  approverId: string,
  remarks?: string
): Promise<ApprovalResult> {
  const lookup = await readApprovalRow(documentId)

  if (lookup.exists) {
    const { error } = await supabase
      .from('approvals')
      .update({
        status: 'Approved' as ApprovalStatus,
        approver_id: approverId,
        date: new Date().toISOString(),
        notes: remarks || null,
      })
      .eq('document_id', documentId)
    if (error) throw new Error(`Failed to update approval record: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('approvals')
      .insert({
        document_id: documentId,
        step: 'Review',
        status: 'Approved' as ApprovalStatus,
        approver_id: approverId,
        date: new Date().toISOString(),
        notes: remarks || null,
      })
    if (error) throw new Error(`Failed to create approval record: ${error.message}`)
  }

  // Update document status. If this fails, roll back the approval row change.
  const { error: docError } = await supabase
    .from('documents')
    .update({ status: 'Approved' })
    .eq('id', documentId)

  if (docError) {
    if (lookup.exists) {
      await rollbackApprovalRow(lookup.snapshot)
    } else {
      const { error: deleteError } = await supabase
        .from('approvals')
        .delete()
        .eq('document_id', documentId)
      if (deleteError) {
        console.error(
          `[approvals] Could not delete newly-inserted approval row after document update failure. ` +
          `document_id=${documentId}. Error: ${deleteError.message}`
        )
      }
    }
    throw new Error(`Failed to update document status: ${docError.message}`)
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  let notificationWarning: string | undefined
  if (doc?.owner_id) {
    const warn = await tryInsertNotification(
      doc.owner_id,
      'approval',
      'Document Approved',
      `Your document "${doc.title}" has been approved.${remarks ? ` Remarks: ${remarks}` : ''}`,
      documentId
    )
    if (warn) notificationWarning = `Approval saved, but owner notification failed: ${warn}`
  }

  return { success: true, ...(notificationWarning ? { notificationWarning } : {}) }
}

export async function rejectDocument(
  documentId: string,
  approverId: string,
  remarks?: string
): Promise<ApprovalResult> {
  const lookup = await readApprovalRow(documentId)

  if (lookup.exists) {
    const { error } = await supabase
      .from('approvals')
      .update({
        status: 'Rejected' as ApprovalStatus,
        approver_id: approverId,
        date: new Date().toISOString(),
        notes: remarks || null,
      })
      .eq('document_id', documentId)
    if (error) throw new Error(`Failed to update approval record: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('approvals')
      .insert({
        document_id: documentId,
        step: 'Review',
        status: 'Rejected' as ApprovalStatus,
        approver_id: approverId,
        date: new Date().toISOString(),
        notes: remarks || null,
      })
    if (error) throw new Error(`Failed to create approval record: ${error.message}`)
  }

  const { error: docError } = await supabase
    .from('documents')
    .update({ status: 'Rejected' })
    .eq('id', documentId)

  if (docError) {
    if (lookup.exists) {
      await rollbackApprovalRow(lookup.snapshot)
    } else {
      const { error: deleteError } = await supabase
        .from('approvals')
        .delete()
        .eq('document_id', documentId)
      if (deleteError) {
        console.error(
          `[approvals] Could not delete newly-inserted approval row after document update failure. ` +
          `document_id=${documentId}. Error: ${deleteError.message}`
        )
      }
    }
    throw new Error(`Failed to update document status: ${docError.message}`)
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  let notificationWarning: string | undefined
  if (doc?.owner_id) {
    const warn = await tryInsertNotification(
      doc.owner_id,
      'rejection',
      'Document Rejected',
      `Your document "${doc.title}" was rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      documentId
    )
    if (warn) notificationWarning = `Rejection saved, but owner notification failed: ${warn}`
  }

  return { success: true, ...(notificationWarning ? { notificationWarning } : {}) }
}

export async function submitForApproval(documentId: string, _submitterId: string): Promise<ApprovalResult> {
  const lookup = await readApprovalRow(documentId)

  if (lookup.exists) {
    const { error: updateError } = await supabase
      .from('approvals')
      .update({ status: 'Pending' as ApprovalStatus, approver_id: null, date: null, notes: null })
      .eq('document_id', documentId)
    if (updateError) throw new Error(`Failed to update approval record: ${updateError.message}`)
  } else {
    const { error: insertError } = await supabase
      .from('approvals')
      .insert({
        document_id: documentId,
        step: 'Review',
        status: 'Pending' as ApprovalStatus,
      })
    if (insertError) throw new Error(`Failed to create approval record: ${insertError.message}`)
  }

  // Update document status. If this fails, roll back the approval row change.
  const { error: docError } = await supabase
    .from('documents')
    .update({ status: 'In Review' })
    .eq('id', documentId)

  if (docError) {
    if (lookup.exists) {
      await rollbackApprovalRow(lookup.snapshot)
    } else {
      const { error: deleteError } = await supabase
        .from('approvals')
        .delete()
        .eq('document_id', documentId)
      if (deleteError) {
        console.error(
          `[approvals] Could not delete newly-inserted approval row after document update failure. ` +
          `document_id=${documentId}. Error: ${deleteError.message}`
        )
      }
    }
    throw new Error(`Failed to update document status: ${docError.message}`)
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  let notificationWarning: string | undefined
  if (doc) {
    const { data: reviewers } = await supabase
      .from('users')
      .select('id, roles:role_id(name)')
      .eq('status', 'Active')

    const reviewerIds = (reviewers || [])
      .filter((u: any) => u.roles?.name === 'Admin' || u.roles?.name === 'Manager')
      .map((u: any) => u.id)
      .filter((id: string) => id !== doc.owner_id)

    const warnings: string[] = []
    for (const reviewerId of reviewerIds) {
      const warn = await tryInsertNotification(
        reviewerId,
        'review',
        'Document Awaiting Review',
        `"${doc.title}" has been submitted for approval.`,
        documentId
      )
      if (warn) warnings.push(warn)
    }
    if (warnings.length > 0) {
      notificationWarning = `Submission saved, but ${warnings.length} reviewer notification(s) failed.`
    }
  }

  return { success: true, ...(notificationWarning ? { notificationWarning } : {}) }
}
