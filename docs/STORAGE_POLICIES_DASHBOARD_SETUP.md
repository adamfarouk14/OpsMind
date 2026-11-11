# Storage policies for the `documents` bucket

Applies to Supabase project `vbuaonmiilgcgwhshipv`, bucket `documents`.

**Status: DONE and verified on Production, 2026-11-11.** The four broad policies
are gone, the four registry-backed policies below are live, and the access
scenarios were re-run against the real database. This file is now a record of
what is applied plus the readiness and confirmation queries, not a to-do list.
Bucket settings were not touched, and no stored file was uploaded, moved or
deleted.

## How these policies were actually applied

An earlier revision of this file said the policy DDL had to be carried out in
Dashboard → Storage → Policies, on the grounds that `storage.objects` is owned by
`supabase_storage_admin`, our SQL role is `postgres`, and `CREATE POLICY`
therefore fails with `42501 must be owner of table objects`. **That statement was
wrong.** The ownership facts were right — `postgres` owns neither
`storage.objects` nor `storage.buckets`, and
`pg_has_role('postgres','supabase_storage_admin','usage')` is still false — but
the DDL is accepted anyway from `supabase db query --linked --file`, so all of it
went through the SQL path. The Dashboard remains a perfectly good way to do it;
it is no longer a requirement.

The scripts that ran, in order, are kept in `db_backup/`:
`05_create_new_storage_policies.sql`, `06_drop_broad_storage_policies.sql`,
`10_add_admin_cleanup_select_policy.sql`. `06b_restore_old_broad_policies.sql`
reverses the removal if that is ever needed.

Nothing here touches bucket settings, Storage object data, table structure or
grants on `storage.*`.

## Before applying: is the registry ready?

```sql
SELECT candidates_seen, registered, duplicates_skipped,
       missing_objects, uploader_unproven,
       unusable_paths, ambiguous_paths, policy_ready, review_notes
FROM public.attachment_backfill_report;
```

- `policy_ready = true` → the registry covers every reference that has real
  bytes in the bucket, so narrowing `SELECT` cannot cut off a download.
- `policy_ready = false` → fix the `unusable_paths` and `ambiguous_paths` items
  listed in `review_notes` first. `missing_objects` and `uploader_unproven` are
  reported for information and **do not block** this cutover: a dead reference
  has nothing to serve, and an unproven uploader is still recorded as
  `legacy_unverified` once its document association is verified.

Production values on 2026-11-11: `14` seen, `10` registered, `4` duplicates
skipped, `0` missing, `0` uploaders unproven, `0` unusable paths, `0` ambiguous
paths, `policy_ready = true`, `review_notes` NULL. The registry is 10
`available` / `legacy_attributed` rows over 3 distinct paths.

## The policy set

Everything is scoped to `bucket_id = 'documents'`. No policy here looks at the
folder inside the path — the folder is a label, never an authorization.

| # | Policy name | Operation | Applied to | Check |
|---|---|---|---|---|
| 1 | `attachments_select_through_document` | SELECT | `authenticated` | Custom read check |
| 2 | `attachments_select_admin_cleanup` | SELECT | `authenticated` | Custom cleanup check |
| 3 | `attachments_insert_registered_pending` | INSERT | `authenticated` | Custom insert check |
| 4 | `attachments_delete_cleanup_queued` | DELETE | `authenticated` | Custom cleanup check |
| — | *(no UPDATE policy at all)* | UPDATE | — | denied by absence |

### 1. Read only through an authorized document association

```sql
bucket_id = 'documents' AND public.can_read_attachment(bucket_id, name)
```

`can_read_attachment` requires an `available` registry row for this exact
bucket + path whose document the caller may view. No registry row, or a
`pending` one, means no download — even if the path is guessed correctly.

### 2. Let an Admin see the object row they are about to clean up

```sql
bucket_id = 'documents' AND public.can_cleanup_attachment(bucket_id, name)
```

This policy exists because of a PostgreSQL rule the original design missed:
**the SELECT policies also decide which rows a DELETE or an UPDATE can reach.**
`can_cleanup_attachment` is only true when no registry row references the path,
which is precisely when `can_read_attachment` is false. With policy 1 alone an
Admin cleanup found nothing to delete and `storage.remove()` quietly removed zero
files — measured on Production on 2026-11-11, before and after, with the rest of
the set held constant.

It is not a general read path. `can_cleanup_attachment` is false for a Manager
and for a Support Agent, false for an Admin with no open cleanup request, and
false while any document still references the file.

### 3. Upload only onto a path the caller personally registered as pending

```sql
bucket_id = 'documents' AND public.can_upload_attachment(bucket_id, name)
```

`can_upload_attachment` requires a `pending` registry row for this exact path,
`uploaded_by` equal to the caller, and edit rights on the document. A client
cannot stage a row for someone else and cannot mark it available by hand.

### 4. Delete only through the Admin cleanup queue

```sql
bucket_id = 'documents' AND public.can_cleanup_attachment(bucket_id, name)
```

`can_cleanup_attachment` requires all three:

- the caller is an active **Admin**;
- an open (`queued` or `failed`) row in `public.attachment_cleanup_requests`
  for this exact bucket + path;
- **no remaining row** in `public.document_attachments` for that path, so a
  file still attached to any document or version cannot be deleted, no matter
  who asks.

The queue row is created only by `request_attachment_cleanup(attachment_id)`,
which itself demands an Admin and a real registered attachment. That is what
stops a direct `storage.remove()` call — from DevTools, curl, or any other
client — from destroying a file another document still uses.

One detail a manual SQL test has to handle: `storage.protect_delete` refuses a
direct `DELETE FROM storage.objects` unless `storage.allow_delete_query` is
`true`, which is what the storage API sets per request. Without that setting the
trigger raises `42501` before RLS is consulted, which looks exactly like a policy
failure and is not one.

## Where the app uses this

Administration → **Attachments** (visible to Admins only) lists uploads left
pending for more than an hour, clears the ones whose file never arrived,
reconciles the ones whose file did, and shows the cleanup queue with its last
error and a "Remove again" action. Nothing there deletes a file that is not
already queued, and no part of the app lists the bucket.

## Order of operations that was followed

1. Apply the migration and read `public.attachment_backfill_report` (above).
2. **Create** the policies, verifying each against `pg_policies` before moving on.
   Policies are OR-ed, so adding them while the old ones exist changes nothing
   for users.
3. **Remove** the four broad policies once all new ones were confirmed active:
   `Anyone can read documents` (SELECT, all roles including anon),
   `Users can download documents` (SELECT, authenticated),
   `Users can upload documents` (INSERT), `Users can delete documents` (DELETE).
   Both SELECT policies had to go — leaving either one keeps every file in the
   bucket readable by anyone with a JWT.
4. Confirm **no UPDATE policy** exists. Without one, replace, move and rename
   are denied for `authenticated`.
5. Leave RLS **enabled and not forced** on `storage.objects`, exactly as Supabase
   ships it. Do not run `ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY`,
   and do not change grants or bucket settings.

If a policy expression is rejected, stop and report the error text rather than
simplifying it. A policy narrowed to `bucket_id = 'documents'` alone is the
unsafe state this work removes.

## Verification: what was tested and what it returned

Each case runs as `authenticated` with real JWT claims (`SET LOCAL ROLE
authenticated` plus `request.jwt.claims`) inside a transaction that ends in
`ROLLBACK`, so nothing a test writes survives. That is the same role and the same
claims the storage API installs, which makes it a fair test of the policies; it
is not a substitute for the HTTP route, listed under "Still open". Harness:
`db_backup/09_access_tests.sh`. Raw results:
`db_backup/11_access_tests_after_fix.txt`.

| Scenario | Expected | Result |
|---|---|---|
| Download a file registered `available` to a document the caller may open — Support Agent / Manager / Admin | allowed | pass (1 row each) |
| Download a file with no registry row — Admin / Support Agent | denied | pass (0 rows) |
| Any read as `anon` | denied | pass (0 rows) |
| File attached only to a Draft document — Support Agent / Admin | denied / allowed | pass (0 then 1) |
| `storage.remove()` as Manager / Support Agent | denied | pass (0 rows) |
| `storage.remove()` as Admin while a live document still references the file | denied | pass (0 rows) |
| `storage.remove()` as Admin after queueing and removing the association | allowed | **pass (1 row) — the case policy 2 fixed** |
| The same queued state as Manager | denied | pass (0 rows) |
| A queued, unattached object readable by Manager / Support Agent | denied | pass (0 rows) |
| Upload to a path never registered | denied | pass (`42501` RLS violation) |
| Upload to a path the caller registered as `pending` | allowed | pass |
| Upload to another account's `pending` path | denied | pass (`42501` RLS violation) |
| Rename / replace an object as Admin or Support Agent | denied | pass (0 rows) |

## Confirm the live state (read-only)

```sql
SELECT policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

The result must show exactly the four `attachments_*` policies and none of the
four broad ones, which is what Production reports on 2026-11-11.

## Still open after this

- The per-role HTTP matrix through the deployed app has not been re-run since the
  policies went live: the Production frontend bundle predates the registry
  client, so it exercises neither the new upload lifecycle nor a real role
  switch. Deploy the current build and repeat the scenarios above through the app
  as each of the three accounts.
- Objects in the bucket with **no registry row at all** (the 5 orphans, or a
  historical file whose reference was ambiguous) cannot be queued for cleanup,
  because a request needs a registered attachment. They stay in the bucket and
  stay unreadable. Listing and removing them is a deliberate, separate Admin
  action — never part of this migration.
- Bucket size and MIME limits are dashboard settings and were not applied.
- Any path that `attachment_object_exists` reports as missing stays a dead
  marker inside document content. It grants nothing, but it should be cleaned
  out of the text when convenient.
