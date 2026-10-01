import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'documents'

export async function uploadDocumentVersionFile(
  documentId: string,
  version: string,
  file: File,
  userId: string
): Promise<{ path: string; fileName: string }> {
  const ext = file.name.split('.').pop()
  const fileName = file.name
  const path = `${documentId}/${version}_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: false })

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`)
  }

  return { path, fileName }
}

export function getPublicFileUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

export async function downloadDocumentFile(path: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

    const blob = new Blob([data])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Download failed')
  }
}

export async function deleteDocumentFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`)
  }
}
