import { supabase } from './supabase'

export const ATTACHMENT_BUCKET = 'documents'

const MARKER = /\[Attached file: ([^\]]+)\]/g
const PUBLIC_URL_MARK = `/storage/v1/object/public/${ATTACHMENT_BUCKET}/`

// New uploads store the raw storage path in the marker; documents created before
// P0 stored getPublicUrl output, which never served files from this private bucket.
export function extractAttachments(content: string | null): { path: string; fileName: string }[] {
  if (!content) return []
  const attachments: { path: string; fileName: string }[] = []
  for (const match of content.matchAll(MARKER)) {
    let ref = match[1].trim()
    const idx = ref.indexOf(PUBLIC_URL_MARK)
    if (idx !== -1) ref = ref.slice(idx + PUBLIC_URL_MARK.length)
    if (!ref || ref.startsWith('http')) continue
    try {
      ref = decodeURIComponent(ref)
    } catch {
      // keep as-is if the path isn't valid percent-encoding
    }
    attachments.push({ path: ref, fileName: ref.split('/').pop() || ref })
  }
  return attachments
}

export function normalizeStoragePath(value: string): string {
  const idx = value.indexOf(PUBLIC_URL_MARK)
  if (idx === -1) return value
  try {
    return decodeURIComponent(value.slice(idx + PUBLIC_URL_MARK.length))
  } catch {
    return value.slice(idx + PUBLIC_URL_MARK.length)
  }
}

export function collectAttachmentPaths(records: { content?: string | null; file_path?: string | null }[]): string[] {
  const paths = new Set<string>()
  for (const record of records) {
    for (const attachment of extractAttachments(record.content ?? null)) paths.add(attachment.path)
    if (record.file_path) {
      const normalized = normalizeStoragePath(record.file_path)
      if (normalized && !normalized.startsWith('http')) paths.add(normalized)
    }
  }
  return [...paths]
}

export async function getSignedAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}
