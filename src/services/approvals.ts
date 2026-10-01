import { supabase } from '../lib/supabase'
import type { ApprovalStatus, DocumentWithOwner } from '../types/database'

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

async function insertNotification(userId: string, type: string, title: string, message: string, documentId: string) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    document_id: documentId,
    is_read: false,
  })
}

export async function approveDocument(documentId: string, remarks?: string) {
  const { error: docError } = await supabase
    .from('documents')
    .update({ status: 'Approved' })
    .eq('id', documentId)

  if (docError) throw docError

  const { error: approvalError } = await supabase
    .from('approvals')
    .update({
      status: 'Approved' as ApprovalStatus,
      date: new Date().toISOString(),
      notes: remarks || null,
    })
    .eq('document_id', documentId)
    .eq('status', 'Pending')

  if (approvalError) throw approvalError

  // Notify the document owner
  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  if (doc?.owner_id) {
    await insertNotification(
      doc.owner_id,
      'approval',
      'Document Approved',
      `Your document "${doc.title}" has been approved.${remarks ? ` Remarks: ${remarks}` : ''}`,
      documentId
    )
  }
}

export async function rejectDocument(documentId: string, remarks?: string) {
  const { error: docError } = await supabase
    .from('documents')
    .update({ status: 'Rejected' })
    .eq('id', documentId)

  if (docError) throw docError

  const { error: approvalError } = await supabase
    .from('approvals')
    .update({
      status: 'Rejected' as ApprovalStatus,
      date: new Date().toISOString(),
      notes: remarks || null,
    })
    .eq('document_id', documentId)
    .eq('status', 'Pending')

  if (approvalError) throw approvalError

  // Notify the document owner
  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  if (doc?.owner_id) {
    await insertNotification(
      doc.owner_id,
      'rejection',
      'Document Rejected',
      `Your document "${doc.title}" was rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      documentId
    )
  }
}

export async function submitForApproval(documentId: string) {
  const { error } = await supabase
    .from('documents')
    .update({ status: 'In Review' })
    .eq('id', documentId)

  if (error) throw error

  // Notify admins/managers that a doc is pending review
  const { data: doc } = await supabase
    .from('documents')
    .select('title, owner_id')
    .eq('id', documentId)
    .single()

  if (doc) {
    // Get all Admin and Manager users
    const { data: reviewers } = await supabase
      .from('users')
      .select('id, roles:role_id(name)')
      .in('status', ['Active'])

    const reviewerIds = (reviewers || [])
      .filter((u: any) => u.roles?.name === 'Admin' || u.roles?.name === 'Manager')
      .map((u: any) => u.id)
      .filter((id: string) => id !== doc.owner_id)

    for (const reviewerId of reviewerIds) {
      await insertNotification(
        reviewerId,
        'review',
        'Document Awaiting Review',
        `"${doc.title}" has been submitted for approval.`,
        documentId
      )
    }
  }
}
