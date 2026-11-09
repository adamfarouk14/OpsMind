import type { UserRole } from '../types/database'

// Single source of truth for OpsMind authorization, mirroring
// OPSMIND_ROLE_PERMISSIONS.md. Nothing here replaces a database check: RLS
// and the Edge Functions enforce the same rules independently.

export const ROLE_NAMES = ['Admin', 'Manager', 'Support Agent'] as const

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && (ROLE_NAMES as readonly string[]).includes(role)
}

export const PERMISSIONS = {
  // User management - Admin only
  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',
  ACTIVATE_USERS: 'activate_users',
  DEACTIVATE_USERS: 'deactivate_users',

  // System governance - Admin only
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_SYSTEM_REPORTS: 'view_system_reports',

  // Documents
  CREATE_DOCUMENTS: 'create_documents',
  EDIT_OWN_DOCUMENTS: 'edit_own_documents',
  EDIT_SUPERVISED_DOCUMENTS: 'edit_supervised_documents',
  HARD_DELETE_DOCUMENTS: 'hard_delete_documents',
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  VIEW_VERSION_HISTORY: 'view_version_history',
  CREATE_VERSION: 'create_version',

  // Workflow and approvals
  SUBMIT_FOR_APPROVAL: 'submit_for_approval',
  REVIEW_DOCUMENTS: 'review_documents',
  APPROVE_DOCUMENTS: 'approve_documents',
  REJECT_DOCUMENTS: 'reject_documents',
  MANAGE_WORKFLOWS: 'manage_workflows',

  // Knowledge
  VIEW_SOPS: 'view_sops',
  MANAGE_SOPS: 'manage_sops',
  SEARCH_KNOWLEDGE: 'search_knowledge',
  USE_AI_ASSISTANT: 'use_ai_assistant',

  // Operational cases
  CREATE_CASES: 'create_cases',
  EDIT_OWN_CASES: 'edit_own_cases',
  VIEW_ALL_CASES: 'view_all_cases',
  MANAGE_CASES: 'manage_cases',

  // Notifications and reports
  VIEW_OWN_NOTIFICATIONS: 'view_own_notifications',
  VIEW_TEAM_REPORTS: 'view_team_reports',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.ACTIVATE_USERS,
    PERMISSIONS.DEACTIVATE_USERS,

    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SYSTEM_REPORTS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.MANAGE_WORKFLOWS,

    // Admin also contributes knowledge, so it holds the ordinary authoring
    // permissions. Governance powers above are the ones no other role gets.
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.EDIT_OWN_DOCUMENTS,
    PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS,
    PERMISSIONS.HARD_DELETE_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_VERSION_HISTORY,
    PERMISSIONS.CREATE_VERSION,

    PERMISSIONS.SUBMIT_FOR_APPROVAL,
    PERMISSIONS.REVIEW_DOCUMENTS,
    PERMISSIONS.APPROVE_DOCUMENTS,
    PERMISSIONS.REJECT_DOCUMENTS,

    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.MANAGE_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    PERMISSIONS.USE_AI_ASSISTANT,

    PERMISSIONS.CREATE_CASES,
    PERMISSIONS.EDIT_OWN_CASES,
    PERMISSIONS.VIEW_ALL_CASES,
    PERMISSIONS.MANAGE_CASES,

    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
  ],

  Manager: [
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.EDIT_OWN_DOCUMENTS,
    PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_VERSION_HISTORY,
    PERMISSIONS.CREATE_VERSION,

    PERMISSIONS.SUBMIT_FOR_APPROVAL,
    PERMISSIONS.REVIEW_DOCUMENTS,
    PERMISSIONS.APPROVE_DOCUMENTS,
    PERMISSIONS.REJECT_DOCUMENTS,

    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    PERMISSIONS.USE_AI_ASSISTANT,

    PERMISSIONS.CREATE_CASES,
    PERMISSIONS.EDIT_OWN_CASES,
    PERMISSIONS.VIEW_ALL_CASES,
    PERMISSIONS.MANAGE_CASES,

    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
  ],

  'Support Agent': [
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.EDIT_OWN_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_VERSION_HISTORY,
    PERMISSIONS.CREATE_VERSION,

    PERMISSIONS.SUBMIT_FOR_APPROVAL,

    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    PERMISSIONS.USE_AI_ASSISTANT,

    PERMISSIONS.CREATE_CASES,
    PERMISSIONS.EDIT_OWN_CASES,

    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
  ],
}

export function getRolePermissions(role: UserRole | null | undefined): Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] ?? []
}

export function roleHasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission)
}

export function roleHasAny(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => roleHasPermission(role, permission))
}

export function roleHasAll(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => roleHasPermission(role, permission))
}

export interface PermissionSubject {
  role: UserRole | null | undefined
  id?: string
}

// Ownership-aware checks. A role alone is never enough to touch someone
// else's record.
export function canEditRecord(subject: PermissionSubject, ownerId: string | null | undefined): boolean {
  if (roleHasPermission(subject.role, PERMISSIONS.EDIT_OWN_DOCUMENTS) && subject.id && subject.id === ownerId) return true
  return roleHasPermission(subject.role, PERMISSIONS.EDIT_SUPERVISED_DOCUMENTS)
}

export function canViewRecord(subject: PermissionSubject, ownerId: string | null | undefined, status: string): boolean {
  if (subject.role === 'Admin' || subject.role === 'Manager') return true
  if (subject.id && subject.id === ownerId) return true
  return status === 'Approved'
}

// Approving your own submission is refused for every role, so Admin cannot
// silently bypass review of content it authored.
export function canReviewRecord(
  subject: PermissionSubject,
  record: { owner_id?: string | null; author_id?: string | null },
): boolean {
  if (!roleHasAny(subject.role, [PERMISSIONS.APPROVE_DOCUMENTS])) return false
  if (subject.id && (subject.id === record.owner_id || subject.id === record.author_id)) return false
  return true
}

export function canHardDelete(subject: PermissionSubject): boolean {
  return roleHasPermission(subject.role, PERMISSIONS.HARD_DELETE_DOCUMENTS)
}
