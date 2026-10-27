import type { UserRole } from '../types/database'

// Define all permissions in the system
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',
  ACTIVATE_USERS: 'activate_users',
  DEACTIVATE_USERS: 'deactivate_users',
  
  // System Management
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_SYSTEM_REPORTS: 'view_system_reports',
  
  // Document Management
  CREATE_DOCUMENTS: 'create_documents',
  EDIT_OWN_DOCUMENTS: 'edit_own_documents',
  EDIT_ALL_DOCUMENTS: 'edit_all_documents',
  DELETE_DOCUMENTS: 'delete_documents',
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  
  // Workflow & Approvals
  APPROVE_DOCUMENTS: 'approve_documents',
  REJECT_DOCUMENTS: 'reject_documents',
  MANAGE_WORKFLOWS: 'manage_workflows',
  
  // SOPs & Knowledge
  VIEW_SOPS: 'view_sops',
  MANAGE_SOPS: 'manage_sops',
  SEARCH_KNOWLEDGE: 'search_knowledge',
  USE_AI_ASSISTANT: 'use_ai_assistant',
  
  // Operational Cases
  CREATE_CASES: 'create_cases',
  EDIT_OWN_CASES: 'edit_own_cases',
  VIEW_ALL_CASES: 'view_all_cases',
  MANAGE_CASES: 'manage_cases',
  
  // Notifications & Reports
  VIEW_OWN_NOTIFICATIONS: 'view_own_notifications',
  VIEW_TEAM_REPORTS: 'view_team_reports',
} as const

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: [
    // User Management
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.ACTIVATE_USERS,
    PERMISSIONS.DEACTIVATE_USERS,
    
    // System Management
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SYSTEM_REPORTS,
    
    // Document Management (for administration purposes)
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.EDIT_ALL_DOCUMENTS,
    PERMISSIONS.DELETE_DOCUMENTS,
    
    // Workflow Management
    PERMISSIONS.MANAGE_WORKFLOWS,
    
    // Knowledge & SOPs
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.MANAGE_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    
    // Cases (administrative access)
    PERMISSIONS.VIEW_ALL_CASES,
    PERMISSIONS.MANAGE_CASES,
  ],
  
  Manager: [
    // Document Management
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.EDIT_OWN_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    
    // Workflow & Approvals
    PERMISSIONS.APPROVE_DOCUMENTS,
    PERMISSIONS.REJECT_DOCUMENTS,
    
    // SOPs & Knowledge
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    PERMISSIONS.USE_AI_ASSISTANT,
    
    // Operational Cases
    PERMISSIONS.CREATE_CASES,
    PERMISSIONS.EDIT_OWN_CASES,
    PERMISSIONS.VIEW_ALL_CASES,
    PERMISSIONS.MANAGE_CASES,
    
    // Notifications & Reports
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
  ],
  
  Employee: [
    // Document Management
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.EDIT_OWN_DOCUMENTS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    
    // SOPs & Knowledge
    PERMISSIONS.VIEW_SOPS,
    PERMISSIONS.SEARCH_KNOWLEDGE,
    PERMISSIONS.USE_AI_ASSISTANT,
    
    // Operational Cases
    PERMISSIONS.CREATE_CASES,
    PERMISSIONS.EDIT_OWN_CASES,
    
    // Notifications
    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,
  ],
}

/**
 * Check if a user has a specific permission based on their role
 */
export function hasPermission(userRole: UserRole | null | undefined, permission: string): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | null | undefined, permissions: string[]): boolean {
  if (!userRole) return false
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole | null | undefined, permissions: string[]): boolean {
  if (!userRole) return false
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Check if user can manage users (Admin only)
 */
export function canManageUsers(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.MANAGE_USERS)
}

/**
 * Check if user can approve documents (Admin or Manager)
 */
export function canApproveDocuments(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.APPROVE_DOCUMENTS)
}

/**
 * Check if user can access system settings (Admin only)
 */
export function canAccessSystemSettings(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.MANAGE_SYSTEM_SETTINGS)
}

/**
 * Check if user can view audit logs (Admin only)
 */
export function canViewAuditLogs(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.VIEW_AUDIT_LOGS)
}

/**
 * Check if user can create documents
 */
export function canCreateDocuments(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.CREATE_DOCUMENTS)
}

/**
 * Check if user can search knowledge base
 */
export function canSearchKnowledge(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.SEARCH_KNOWLEDGE)
}

/**
 * Check if user can use AI assistant
 */
export function canUseAI(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.USE_AI_ASSISTANT)
}
