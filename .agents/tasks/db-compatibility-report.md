# OpsMind Database Compatibility Report

**Generated from:** local code analysis only (no remote Supabase access)  
**Scope:** `src/types/database.ts`, `src/services/*`, `src/contexts/AuthContext.tsx`, `src/pages/*`, `supabase/functions/ask-groq/index.ts`

---

## Summary

The codebase and `database.ts` schema are **largely consistent**. All six tables defined in `database.ts` are actively used by at least one service or page. There are **no critical missing columns**, but there are **three noteworthy mismatches**, **one confirmed mock/static-data feature**, and **several dead schema columns** that are defined but never written or read.

---

## 1. Tables the Code Expects

### `roles`
| Column | Used by |
|--------|---------|
| `id` | `services/auth.ts` (lookup by `name`), `services/users.ts` (join via `role_id`) |
| `name` | `services/auth.ts`, `services/users.ts`, `contexts/AuthContext.tsx`, `services/approvals.ts` |
| `permissions` | `contexts/AuthContext.tsx` (loaded into user session) |
| `description` | Defined in schema; read indirectly via `select('*')` in `services/users.ts` / `getRoles()` shown in `Administration.tsx` |

### `users`
| Column | Used by |
|--------|---------|
| `id` | All services (PK, FK reference) |
| `email` | `services/auth.ts` (insert), `contexts/AuthContext.tsx` (display) |
| `name` | All services and pages (display) |
| `password_hash` | `services/auth.ts` (inserted as empty string `''`); `services/users.ts` `createUser` accepts it |
| `role_id` | `services/users.ts` (insert, update, join), `services/approvals.ts` (filter by role name) |
| `department` | `services/auth.ts` (insert), `services/users.ts` (update), `pages/Profile.tsx` (display/update) |
| `status` | `services/users.ts` (update), `services/approvals.ts` (filter `Active` users) |
| `initials` | `services/auth.ts` (insert), `services/users.ts` (update), all pages (avatar display) |
| `avatar_color` | `services/auth.ts` (insert), `services/users.ts` (update), all pages (avatar display) |
| `last_active_at` | Read in `pages/Administration.tsx` (displayed); **never written** by any service |
| `created_at` | Implicitly read via `select('*')` |
| `updated_at` | Implicitly read via `select('*')` |

### `documents`
| Column | Used by |
|--------|---------|
| `id` | All document services and pages |
| `title` | All document services and pages |
| `code` | All document services and pages |
| `type` | `services/documents.ts`, `pages/Documents.tsx`, `pages/Reports.tsx` |
| `version` | `services/documents.ts` (insert/update), pages (display) |
| `description` | `services/documents.ts` (insert/update/search), pages (display) |
| `content` | `services/documents.ts` (insert/update/search), `pages/AIKnowledge.tsx` (passed to Edge Function) |
| `tags` | `services/documents.ts` (insert/update); **not displayed anywhere** in current pages |
| `status` | `services/documents.ts`, `services/approvals.ts` (filter/update), all pages |
| `owner_id` | `services/documents.ts` (insert), `services/approvals.ts` (read for notification) |
| `created_at` | `pages/Reports.tsx` (date-range filter) |
| `updated_at` | `services/documents.ts` (order), all pages (display) |

### `document_versions`
| Column | Used by |
|--------|---------|
| `id` | `services/documents.ts` (count query in `pages/Dashboard.tsx`) |
| `document_id` | `services/documents.ts` (insert, filter) |
| `version` | `services/documents.ts` (insert) |
| `author_id` | `services/documents.ts` (insert, join → `users`) |
| `notes` | `services/documents.ts` (insert) |
| `created_at` | `services/documents.ts` (order) |

### `approvals`
| Column | Used by |
|--------|---------|
| `id` | implicitly via `select('*')` |
| `document_id` | `services/approvals.ts` (filter, insert via update) |
| `step` | Defined in schema; **read via `select('*')`** in `getDocumentById` but **never written** by any service call (the `approveDocument`/`rejectDocument` only `update` existing rows, never insert) |
| `approver_id` | Never written by any current service; only read via `select('*')` |
| `status` | `services/approvals.ts` (update, filter `Pending`) |
| `date` | `services/approvals.ts` (update) |
| `notes` | `services/approvals.ts` (update with `remarks`) |
| `created_at` | `services/documents.ts` (order in `getDocumentById`) |
| `updated_at` | Defined in schema; never read or written explicitly |

### `activity_logs`
| Column | Used by |
|--------|---------|
| `id` | `services/activityLogs.ts` (PK) |
| `user_id` | `services/activityLogs.ts` (insert, join → `users`) |
| `action` | `services/activityLogs.ts` (insert), `pages/Dashboard.tsx` (filter `create`/`edit`), `pages/Reports.tsx`, `pages/Profile.tsx` |
| `target_type` | `services/activityLogs.ts` (insert) |
| `target_id` | `services/activityLogs.ts` (insert) |
| `target_title` | `services/activityLogs.ts` (insert), `pages/ActivityLogs.tsx` (display) |
| `target_code` | `services/activityLogs.ts` (insert), `pages/ActivityLogs.tsx` (display) |
| `details` | `services/activityLogs.ts` (insert), `pages/ActivityLogs.tsx` (display) |
| `ip_address` | `services/activityLogs.ts` (insert schema), `pages/ActivityLogs.tsx` (display); **never actually populated** in any `logActivity` call |
| `created_at` | All pages (display, filter) |

### `notifications`
| Column | Used by |
|--------|---------|
| `user_id` | `services/approvals.ts` (`insertNotification`) |
| `type` | `services/approvals.ts` (`insertNotification`) |
| `title` | `services/approvals.ts` (`insertNotification`) |
| `message` | `services/approvals.ts` (`insertNotification`) |
| `document_id` | `services/approvals.ts` (`insertNotification`) |
| `is_read` | `services/approvals.ts` (`insertNotification`, hardcoded `false`) |
| `created_at` | Implicitly set by DB default |

**Note:** Notifications are **written** (inserted) by `services/approvals.ts`, but are **never read** anywhere in the current codebase. There is no notification bell, notification page, or polling mechanism in any page or service file.

---

## 2. Mismatches: Columns Queried but Not in `database.ts` Schema

### Mismatch 1 — `approvals.step` column: never inserted by code
**Severity:** Medium  
**File:** `src/services/approvals.ts` — `approveDocument()` and `rejectDocument()` call:
```ts
supabase.from('approvals').update({ status, date, notes }).eq('document_id', documentId).eq('status', 'Pending')
```
This only updates *existing* approval rows. No service inserts into `approvals`. For this to work, the database must already have approval rows with `status = 'Pending'` pre-seeded (e.g., by a trigger or manual seed). If those rows don't exist, the update silently affects 0 rows and no error is thrown.  
**`database.ts`** defines `approvals.step` as a required `string` on Insert — but no code ever calls `.insert()` on `approvals`.

### Mismatch 2 — `users.last_active_at` is displayed but never updated
**Severity:** Low  
**File:** `src/pages/Administration.tsx` renders `user.last_active_at` in the Users table (formatted as a date or "Never").  
No service ever writes `last_active_at`. It will show "Never" for all users unless updated by an external mechanism (e.g., a Supabase trigger on auth sign-in).

### Mismatch 3 — `notifications` table has no read path
**Severity:** Low–Medium  
**File:** `src/services/approvals.ts` writes to `notifications`, but nothing reads from it.  
There is no notification UI in the app. The table is populated on approvals/rejections/submissions, but users never see these notifications.

### Mismatch 4 — `documents.tags` written but not displayed
**Severity:** Low  
**File:** `src/services/documents.ts` inserts and updates `tags` (a `string[]`). No page renders the tags array in the document list or detail views. Data is stored but invisible to users.

### Mismatch 5 — `activity_logs.ip_address` never populated
**Severity:** Low  
**File:** `src/services/activityLogs.ts` — `logActivity()` accepts an optional `ip_address` parameter, but **no caller** ever passes it. Every `logActivity(...)` call across all pages and services omits `ip_address`. The column exists in the DB and the type, but is always `null` in practice.

---

## 3. Mock / Static Data Still in Use

| Location | What Is Hardcoded | Actual Source |
|----------|-------------------|---------------|
| `src/contexts/AuthContext.tsx` (lines ~72–84) | Mock admin login (`admin@opsmind.com` / `admin123`) with hardcoded permissions | Falls back to mock only when `VITE_SUPABASE_URL` is unconfigured. With a real Supabase URL, real auth is used. **Not a production issue if env vars are set.** |
| `src/pages/Search.tsx` `recentSearches` state | Initialized with `['POS installation', 'printer troubleshooting', 'network issues']` hardcoded | No DB persistence for recent searches. Always resets on page load. |
| `src/pages/Reports.tsx` stat badges | `+12%`, `+8%`, `-3%`, `+15%` percentage change badges on overview cards | Pure static strings — not calculated from any data. |
| `src/pages/Administration.tsx` Settings tab | `deptSettings` (`name: 'Technical Support'`, `code: 'TS-001'`, toggles) and `sysConfig` (retention, max file size) | No `settings` table in DB. Values are local React state. Clicking "Save" only logs an activity entry; the values are lost on page refresh. |
| `src/pages/Administration.tsx` "Create Role" button | Renders a button but has no `onClick` handler — it does nothing. | Roles are read-only in the UI despite the button appearing. |
| `src/pages/Profile.tsx` Security section | "Change Password" and "Two-Factor Authentication" buttons render but have no handlers. | Not implemented. |

---

## 4. Dead Schema (Defined in `database.ts` but Unused in Practice)

| Table | Column | Status |
|-------|--------|--------|
| `approvals` | `approver_id` | Never written; only passively read via `select('*')` |
| `approvals` | `step` | Required on Insert in schema; no code ever inserts into `approvals` |
| `approvals` | `updated_at` | Defined; never explicitly read or written |
| `users` | `last_active_at` | Displayed but never written by app code |
| `notifications` | All columns | Inserted on approval events; never read by any page or service |
| `activity_logs` | `ip_address` | Defined and accepted by type; never passed by any caller |
| `documents` | `tags` | Stored correctly; not rendered anywhere in the UI |
| `roles` | `description` | Read via `select('*')` in `getRoles()` and shown in the Administration Roles tab — this one is actually used. |

---

## 5. Summary Table: Feature → DB Compatibility

| Feature | Implementation | DB Dependency | Potential Issue |
|---------|---------------|---------------|-----------------|
| Login / Session | `supabase.auth.signInWithPassword` → fetches `users` + `roles` join | `users`, `roles` | ✅ Works. Falls back to mock if Supabase not configured. |
| User creation (Administration) | `supabase.auth.signUp` → insert into `users` | `users`, `roles` | ⚠️ `password_hash` inserted as `''`; acceptable if Supabase Auth manages passwords, but column name implies a hash field. |
| Document CRUD | `services/documents.ts` | `documents`, `document_versions`, `users` (join) | ✅ Schema fully matches queries. |
| Document Search | `searchDocuments` using `.or(ilike)` | `documents` | ✅ Works. |
| Approval workflow | `services/approvals.ts` updates `documents` + `approvals` + inserts `notifications` | `documents`, `approvals`, `users`, `notifications` | ⚠️ `approvals` rows must be pre-seeded; no insert path exists in code. Silent no-op if rows are absent. |
| Dashboard metrics | Queries `documents`, `activity_logs`, `document_versions` | All three tables | ✅ Works. Percentage badges are static. |
| Reports | `getDocuments()` + `getActivityLogs(500)` | `documents`, `activity_logs` | ✅ Works. Trend % badges are hardcoded. |
| Activity Logs | `getActivityLogs(100)` | `activity_logs` (join `users`) | ✅ Works. `ip_address` always null. |
| AI Knowledge | `searchDocuments` → `supabase.functions.invoke('ask-groq')` | `documents` (read), Edge Function auth via `supabase.auth.getUser()` | ✅ Works. Requires `GROQ_API_KEY` secret set in Supabase project. |
| Notifications | `insertNotification` in `services/approvals.ts` | `notifications` | ⚠️ Written but never read; users never see notifications. |
| Profile page | `getUserById` + `updateUser` + `getActivityLogs` | `users`, `activity_logs` | ✅ Works. `last_active_at` always "Never". |
| Administration – Users | `getUsers`, `updateUser`, `signUp` | `users`, `roles` | ✅ Works. |
| Administration – Settings | Local React state only | None | ⚠️ Settings not persisted; lost on page reload. |
| Search | `getDocuments` + `searchDocuments` | `documents` | ✅ Works. Recent searches are hardcoded, not persisted. |
| Roles tab | `getRoles()` | `roles` | ✅ Read-only display works. "Create Role" button is a no-op. |

---

## 6. Recommendations (No Implementation — Observations Only)

1. **Approval row seeding:** Either add a trigger on `documents` insert/update to `INSERT INTO approvals` with `status='Pending'`, or add a `createApproval()` call in `services/approvals.ts` / `submitForApproval()`. Currently the approval update silently does nothing if no pending row exists.

2. **Notifications UI:** The `notifications` table is populated but there is no bell icon, notification center, or polling. Either build the read UI or remove the write calls to avoid orphaned data.

3. **`last_active_at`:** Consider adding a Supabase Auth hook / trigger to update `users.last_active_at` on each sign-in, or remove the column from the display in `Administration.tsx`.

4. **Settings persistence:** If department settings and system config need persistence, add a `settings` table or store values in a `metadata`/`config` table. Currently a page reload silently resets all values.

5. **`ip_address` in activity logs:** Either populate it (e.g., from the Edge Function or via a server-side context) or remove the column from the schema to avoid misleading audit records.

6. **Duplicate `import { supabase }` in `AIKnowledge.tsx`:** The file imports `supabase` twice (lines ~9 and ~47). This will cause a TypeScript/bundler warning. One import should be removed.
