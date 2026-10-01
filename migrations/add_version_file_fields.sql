-- Add file_path and file_name columns to document_versions table
ALTER TABLE document_versions 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

COMMENT ON COLUMN document_versions.file_path IS 'Storage path for the version file in Supabase Storage';
COMMENT ON COLUMN document_versions.file_name IS 'Original filename of the uploaded file';
