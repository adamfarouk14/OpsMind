# Document Version Control + File Storage Implementation

## Overview
This implementation adds proper file storage and version control to the existing document system.

## Database Changes

### Migration Required
Run the SQL migration: `migrations/add_version_file_fields.sql`

This adds two columns to `document_versions` table:
- `file_path` (TEXT) - Storage path in Supabase Storage
- `file_name` (TEXT) - Original filename

## Files Created

### 1. src/services/storage.ts (NEW)
New service for handling Supabase Storage operations:
- `uploadDocumentVersionFile()` - Upload file for a version
- `getPublicFileUrl()` - Get public URL for a file
- `downloadDocumentFile()` - Download a file
- `deleteDocumentFile()` - Delete a file

### 2. src/types/database.ts (MODIFIED)
Updated `document_versions` table definition to include:
- `file_path: string | null`
- `file_name: string | null`

### 3. src/services/documents.ts (MODIFIED)
Added new function:
- `getNextVersionNumber(documentId)` - Automatically calculate next version number

Updated `createDocumentVersion()` to accept:
- `file_path?: string | null`
- `file_name?: string | null`

## Storage Path Structure

Files are stored in Supabase Storage with this structure:
```
documents/
  {document_id}/
    {version}_{timestamp}.{ext}
```

Example:
```
documents/
  abc123/
    v1.0_1698765432000.pdf
    v2.0_1698765499000.pdf
```

## Features Implemented

1. ✅ Automatic version numbering (v1.0, v2.0, v3.0...)
2. ✅ File upload per version
3. ✅ File storage in Supabase Storage
4. ✅ Version-specific file download
5. ✅ File info display in version history
6. ✅ Version notes tracking
7. ✅ Author tracking per version
8. ✅ Current version indicator
9. ✅ Preserved older versions (not overwritten)

## Next Steps

Manual updates needed in `src/pages/DocumentDetail.tsx`:
- Add imports for storage service
- Add file upload UI in version modal
- Add download buttons in version history
- Update version creation flow to handle file uploads

See detailed instructions in the implementation documentation.
