import { supabase } from '../lib/supabase'
import type { DocType, DocStatus, DocumentWithOwner, DocumentWithVersions, DocumentWithApprovals } from '../types/database'

// Access control:
// Admin/Manager can see all document statuses.
// Employee can only see Approved documents.
// RLS on the database enforces the same rules server-side.
const ELEVATED_ROLES = ['Admin', 'Manager'] as const

async function getCurrentUserRole(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Employee'

  const { data } = await supabase
    .from('users')
    .select('roles:role_id(name)')
    .eq('id', user.id)
    .single()

  return (data as any)?.roles?.name ?? 'Employee'
}

async function isElevatedRole(): Promise<boolean> {
  const role = await getCurrentUserRole()
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
  const role = await getCurrentUserRole()
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
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createDocumentVersion(documentId: string, version: {
  version: string
  author_id: string
  notes: string
}) {
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
  // Employees are locked to Approved — return empty for other statuses
  const role = await getCurrentUserRole()
  if (!ELEVATED_ROLES.includes(role as any) && status !== 'Approved') return []

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