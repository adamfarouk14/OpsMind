import { supabase } from '../lib/supabase'
import type { DocType, DocStatus, DocumentWithOwner, DocumentWithVersions, DocumentWithApprovals } from '../types/database'

export async function getDocuments(): Promise<DocumentWithOwner[]> {
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
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as DocumentWithOwner[]
}

export async function getDocumentById(id: string): Promise<DocumentWithVersions & DocumentWithApprovals> {
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
    .eq('id', id)
    .single()

  if (error) throw error

  // Get versions with author names
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
    .eq('documentId', id)
    .order('created_at', { ascending: false })

  // Get approvals
  const { data: approvals } = await supabase
    .from('approvals')
    .select('*')
    .eq('documentId', id)
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
  file_path?: string | null
  file_name?: string | null
}) {
  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      documentId,
      ...version,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getNextVersionNumber(documentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('version')
    .eq('documentId', documentId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  if (!data || data.length === 0) {
    return 1
  }

  const lastVersion = data[0].version
  const match = lastVersion.match(/v(\d+)\.(\d+)/)
  if (match) {
    return parseInt(match[1]) + 1
  }

  return 1
}

export async function getDocumentsByType(type: DocType): Promise<DocumentWithOwner[]> {
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
    .eq('type', type)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as DocumentWithOwner[]
}

export async function getDocumentsByStatus(status: DocStatus): Promise<DocumentWithOwner[]> {
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
    .or(`title.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as DocumentWithOwner[]
}
