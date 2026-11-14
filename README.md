# OpsMind

A web-based Knowledge Management System built for the Technical Support Department as part of my final year project at Nilai University.

The idea came from a real problem I noticed at work — technical information was scattered everywhere. SOPs in one place, solutions in messages, procedures in someone's head. OpsMind is my attempt to fix that by giving the team one place to store, find, and manage all of it.

---

## What it does

- Create and manage SOPs, technical documents, operational cases, and org info
- Submit documents for approval and track their status through a review workflow
- Version control — every document change is tracked with notes
- Restore an earlier version as a new revision, without rewriting history
- Attach device files and case evidence, kept per document or per version
- Centralized search across all document types
- AI assistant (powered by Groq) that searches the knowledge base and answers questions based on stored documents
- Activity logs for every action in the system
- Role-based access — Admin, Manager, and Support Agent each have different permissions
- Notifications when documents are approved, rejected, or submitted for review

---

## Tech stack

- **React + TypeScript** — frontend
- **Tailwind CSS** — styling
- **shadcn/ui** — UI components
- **Supabase** — database, authentication, and file storage
- **Google Groq API** — AI knowledge retrieval

---

## Getting started

1. Clone the repo
2. Install dependencies

```bash
npm install
```

3. The `.env` file is already configured and committed for this project's Supabase instance. No additional setup is needed — just install and run.

4. Run the app

```bash
npm run dev
```

---

## Database setup

The app requires these tables in Supabase: `roles`, `users`, `documents`, `document_versions`, `approvals`, `activity_logs`, `notifications`.

For a deployment using the hardened access controls, review `supabase/rls_document_access.sql` against the live database policies before applying it. Do not leave Row Level Security disabled on tables containing application or user data. The `create-user` Edge Function must also be deployed with JWT verification enabled; it uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` to create users only after verifying the caller is an Admin. Never expose the service-role key in frontend environment variables.

---

## File attachments and Storage security

**Status: applied to Production (`vbuaonmiilgcgwhshipv`) on 2026-11-11.** The migration was executed, the four broad Storage policies were replaced by the registry-backed ones, and the access scenarios were verified against the live database. What was deliberately not done: no stored file was uploaded, moved or deleted, no bucket setting was changed, no user, role, document or version was modified, and nothing was committed, pushed or deployed. The remaining open items are listed at the end of this section. The registry and the Storage policies are two separate steps by design, so [docs/STORAGE_POLICIES_DASHBOARD_SETUP.md](docs/STORAGE_POLICIES_DASHBOARD_SETUP.md) documents the policy side on its own.

### Why this exists

The `documents` bucket used to carry four broad policies that let any signed-in caller — and, through one of them, any anonymous caller — read, upload and delete any object in it. Those four are gone. A file's folder name is not a permission, and a marker pasted into document text is not one either. The redesign moved the decision from "can you reach the bucket" to "does this file belong to a document you are allowed to see".

### The attachment registry

`public.document_attachments` records which stored file belongs to which document, and optionally to which version of it:

- `document_id` — always set, and it is the only thing that authorizes access.
- `version_id` — `NULL` means the file belongs to the live document row; a value means it belongs to that one snapshot. Version rows are never inherited by the document, and the document row is never inherited by a version.
- `storage_bucket` + `storage_path` — the exact object, matched by name. Nothing in the design lists a bucket or walks a folder.
- `uploaded_by` + `uploader_provenance` — the account that actually put the object in the bucket, proven from Storage's own owner metadata and never copied from the document owner. Storage keeps ownership in two columns (`owner`, a deprecated uuid, and `owner_id`, the current text one), so one helper reads both and casts `owner_id` only when it really holds a UUID. `uploader_provenance` says how the uploader is known: `upload` for a new upload (always credited to the signed-in account), `legacy_attributed` for a historical reference whose Storage owner resolves to a real account, `legacy_unverified` for a file whose document association is proven but whose original uploader is not — those rows have no `uploaded_by` and can never claim one. Because the reference is a restriction rather than a cascade, an account that is credited with attachments cannot be deleted until those files are re-attributed; Administration and the delete-user function both say so instead of letting the database raise a foreign-key error.
- `status` — `pending` (registered, upload not confirmed; authorizes only its own uploader's write) or `available` (the object is provably in the bucket; authorizes downloads). A client cannot write `available` itself: there is no UPDATE grant and no UPDATE policy on the table, only the `complete_attachment_upload` function, which checks the object exists and that its owner is the caller.

Uniqueness is split in two on purpose: one document-level row per file, and one row per document/version/file, so an identical combination can never be registered twice while a version may still share a file with another version of the same document.

### Storage policies (applied separately from the migration)

The migration carries no policy DDL for `storage.objects`: the policies are their own step, applied after the backfill report says the registry covers every reference that has real bytes. An earlier version of this file claimed that step had to be done in the Dashboard because `CREATE POLICY` on `storage.objects` fails with `42501` for our SQL role. That claim was wrong. `postgres` is not the owner of the table and is not a member of `supabase_storage_admin`, and the DDL still succeeds through `supabase db query`; that is how all four policies below were applied on 2026-11-11.

| Action | Policy | Command | Live expression |
|---|---|---|---|
| Read through a document | `attachments_select_through_document` | SELECT | `bucket_id = 'documents' AND public.can_read_attachment(bucket_id, name)` |
| Read for an Admin cleanup | `attachments_select_admin_cleanup` | SELECT | `bucket_id = 'documents' AND public.can_cleanup_attachment(bucket_id, name)` |
| Upload | `attachments_insert_registered_pending` | INSERT (WITH CHECK) | `bucket_id = 'documents' AND public.can_upload_attachment(bucket_id, name)` |
| Delete | `attachments_delete_cleanup_queued` | DELETE | `bucket_id = 'documents' AND public.can_cleanup_attachment(bucket_id, name)` |
| Update | *(none exists)* | UPDATE | denied by absence — rename, move and in-place replacement fail for every role |

`attachments_select_admin_cleanup` is not an extra privilege someone can walk up to. PostgreSQL also applies the SELECT policies to the rows a DELETE is allowed to reach, and `can_cleanup_attachment` is only true in the exact state where `can_read_attachment` is false — an open cleanup request and no registry row left for that path. Without the second read policy an Admin cleanup could never see the object row, so the queue-authorized removal would silently delete nothing; verified on Production on 2026-11-11. The policy resolves to false for a Manager, a Support Agent and an Admin without a queued request, which is what keeps it from being a general read path.

**The Storage security problem is closed by this set.** The live inventory, the backfill values and the 21 verified access scenarios are recorded in [docs/STORAGE_POLICIES_DASHBOARD_SETUP.md](docs/STORAGE_POLICIES_DASHBOARD_SETUP.md).

Supabase-managed Storage table grants are left exactly as they are, and `storage.objects` keeps RLS enabled without `FORCE`, because the storage API executes as `authenticated`.

### Upload lifecycle

The permanent record is never created before the file exists, and a marker never reaches the document text before its association is `available`:

1. **New document, or a document edited without a new version** — a `pending` row is registered for the chosen path, the file is uploaded into it (`upsert: false`), the upload is confirmed to `available`, and only then is the content saved with the marker.
2. **New version (revision)** — a temporary document-level `pending` row authorizes the upload, the file is stored and confirmed, the new version row is written with the file, a version-scoped `available` row is created, and the staging row is retired. A staged revision's file therefore never appears on the live document page.
3. **Failure during upload** — the pending row is cancelled, and a cancellation that could not happen is reported instead of swallowed.
4. **Failure after the file landed** — the file is real, so its record is kept for reconciliation (`reconcile_attachment_upload`) or for the Admin cleanup queue; nothing is silently abandoned and nothing is deleted behind the user's back.

### Pending uploads and the cleanup queue (Administration → Attachments)

Admins can inspect uploads left pending for over an hour, clear the ones whose file never arrived, and reconcile the ones whose file did. Reconciling and purging never touch a Storage object. Removing a stored file requires a row in `public.attachment_cleanup_requests`, which only a definer function creates for an Admin; the queue is readable by Admins and writable by nobody through the API, so a failed removal stays visible and retryable rather than disappearing.

### Download

Downloads use short-lived signed URLs (60 seconds) minted for one exact path, and open in a new tab with `noopener` so the document page stays where it was. There is no public bucket URL and no folder address. A content marker on its own authorizes nothing: with the migration applied, a path that is not registered against a visible document cannot be read or signed.

> Verified on Production 2026-11-11: visibility of a `storage.objects` row is decided by the two SELECT policies, so a path with no registry row is invisible to every role including Admin, and a path registered against a document the caller may open is readable. Not yet re-run since the cutover: the per-role HTTP matrix through the deployed app, because the live frontend bundle still predates the registry client. It needs the new build deployed and a real sign-in per role.

### Document-level versus version-level attachments

- The document page lists the live document's own associations plus those of the version that is currently published, and labels which of the two each file came from.
- A version page lists only that version's own files, under the caption "Version attachments".
- Older revisions keep their files on their own pages; nothing cascades.

### Restoring an earlier version

Restore copies an old snapshot forward as a brand-new revision with a number higher than every version the document has ever used. History is never rewritten and nothing is deleted. The files of the restored version are re-associated with the new revision rather than uploaded again; only the account that provably uploaded a file may claim it, so any path it cannot claim is reported and left untouched. If the document is already published, the restored revision is staged for approval like any other change.

### Deleting a document

Deleting a document is an Admin action, and the file cleanup around it is deliberately conservative:

1. Collect the document's own attachment records from the registry (content markers are used only while the migration is unapplied).
2. Check every other document and version for the same path; a file another document still points at is kept.
3. A path with no registry record at all is kept, because no cleanup could be authorized for it.
4. Queue the remaining files for removal, delete the document row (versions and registry rows cascade, while the queue entry survives with its attachment set to `NULL`), then remove each queued object and verify with an Admin-only existence check.
5. Record the outcome of every request, so a removal that failed stays visible and retryable. Report what was kept and why. A file is never deleted merely because its metadata could not be read.

There is no helper that enumerates bucket contents, and no `list()` call anywhere in the attachment code. Because a direct `storage.remove()` is refused unless the path is queued, deleting a document is the only way its files can physically go.

### Backfilling historical references

The migration registers a stored file only when the object exists, the document reference is real, and the version belongs to that document. Files whose bytes are gone are skipped and counted rather than held against the rest; the uploader of an association that is otherwise provable is recorded as `legacy_unverified` instead of being guessed from document ownership, and an account with no profile is never created from a Storage owner value. A path whose document association is genuinely ambiguous blocks the policy switch and is listed for review. Nothing here deletes, moves or rewrites a stored object, and one object shared by several versions of a document becomes several registry rows pointing at the same path.

### File validation

Client-side, before anything is uploaded: 10 MB maximum, and only PDF, DOC, DOCX, XLS, XLSX, PNG, JPEG and TXT. The declared MIME type must agree with the extension; scripts, web pages, SVG, archives and executables are refused, and a browser that reports `application/octet-stream` is judged on its extension. The frontend is a convenience layer, not the security boundary — the bucket settings below are what enforce it server-side.

### What was run on Production, and in what order

1. Preflight: current policies, object inventory and row counts captured to `db_backup/` before anything changed. A real `pg_dump` is not possible from this machine (no Docker/Podman), so the snapshots plus an additive migration plus a generated rollback script are the recovery path.
2. `migrations/20261110000002_storage_attachment_registry.sql` applied in one transaction through `supabase db query --linked --file` — exit 0. Before applying it, the registry table block was moved above the helper functions that reference it: PostgreSQL analyses a `LANGUAGE sql` body when the function is created, so the file as reviewed failed with `42P01`. No statement was skipped or reworded; the pre-reorder copy is `db_backup/ORIGINAL_before_reorder.sql`.
3. `public.attachment_backfill_report`: `candidates_seen 14`, `registered 10`, `duplicates_skipped 4`, `missing_objects 0`, `uploader_unproven 0`, `unusable_paths 0`, `ambiguous_paths 0`, `policy_ready true`.
4. The four Storage policies created, each verified against `pg_policies`, and only then the four broad policies dropped.
5. Access scenarios re-run after every change (`db_backup/09_access_tests.sh`, results in `db_backup/09_access_tests_output.txt` and `db_backup/11_access_tests_after_fix.txt`). Each one runs inside a transaction that ends in `ROLLBACK`, so no test wrote a lasting row; the counts in `document_attachments`, `attachment_cleanup_requests`, `storage.objects`, `documents`, `document_versions` and `users` were re-checked afterwards and are unchanged.

### Still open

- Bucket limits (`10485760` bytes and the MIME list below) have not been set — bucket settings were left exactly as they were, including its private flag.
- The per-role HTTP matrix through the deployed app still has to be run after the new frontend build is deployed; the Production bundle predates the registry client, and the policy checks above were done at the RLS layer the storage API itself uses.
- `supabase_migrations.schema_migrations` was not written: no repo migration is recorded there, and adding only this one would make a future `supabase db push` attempt the others.

### Bucket settings to do by hand (not applied)

Nothing in the migration or the policy step changes bucket configuration. In the Supabase dashboard, open Storage → bucket `documents` → settings:

- File size limit: `10485760` bytes (10 MB).
- Allowed MIME types:
  `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/png, image/jpeg, text/plain`
- Keep the bucket private (no public access).

### What was deliberately left alone

- **The 5 files in the bucket with no registry row were not deleted.** They predate this work, they cannot be queued for cleanup because a request needs a registered attachment, and since the cutover they cannot be read by any role either — including Admin. Removing them is a separate approved step.
- No stored object was uploaded, moved, replaced or deleted; no bucket setting was edited; no user, role, document or version row was created or changed.
- Nothing was committed, pushed or deployed.

---

## Project structure

```
src/
├── pages/          # All page components
├── components/     # Layout and shared UI components
├── services/       # Supabase query functions
├── contexts/       # Auth context
├── types/          # TypeScript types matching the DB schema
└── lib/            # Supabase client setup
migrations/         # SQL files, reviewed and applied by hand
templates/          # Writing structures for knowledge documents
```

---

## Notes

- File uploads are stored in a Supabase Storage bucket named `documents`; see "File attachments and Storage security" above for how access is decided.
- Document writing templates live in `templates/`.
- Default roles are Admin, Manager, and Support Agent. Admins can manage users and access all pages.

---

Adam Mohamed Farouk  
Bachelor of Software Engineering — Nilai University  
SE Project — OEC3328
