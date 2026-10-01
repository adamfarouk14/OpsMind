// Database types matching Supabase schema

export type DocType = 'SOP' | 'Technical Document' | 'Operational Case' | 'Org Info'
export type DocStatus = 'Draft' | 'In Review' | 'Approved' | 'Rejected'
export type ApprovalStatus = 'Not Started' | 'Pending' | 'Approved' | 'Rejected'
export type UserRole = 'Admin' | 'Manager' | 'Support Agent'
export type UserStatus = 'Active' | 'Inactive'

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: UserRole
          description: string | null
          permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: UserRole
          description?: string | null
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: UserRole
          description?: string | null
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string
          role_id: string | null
          department: string
          status: UserStatus
          initials: string | null
          avatar_color: string | null
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash: string
          role_id?: string | null
          department?: string
          status?: UserStatus
          initials?: string | null
          avatar_color?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string
          role_id?: string | null
          department?: string
          status?: UserStatus
          initials?: string | null
          avatar_color?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          code: string
          type: DocType
          version: string
          description: string | null
          content: string | null
          tags: string[]
          status: DocStatus
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          code: string
          type: DocType
          version?: string
          description?: string | null
          content?: string | null
          tags?: string[]
          status?: DocStatus
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          code?: string
          type?: DocType
          version?: string
          description?: string | null
          content?: string | null
          tags?: string[]
          status?: DocStatus
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version: string
          author_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version: string
          author_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          version?: string
          author_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      approvals: {
        Row: {
          id: string
          document_id: string
          step: string
          approver_id: string | null
          status: ApprovalStatus
          date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          step: string
          approver_id?: string | null
          status?: ApprovalStatus
          date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          step?: string
          approver_id?: string | null
          status?: ApprovalStatus
          date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          target_title: string | null
          target_code: string | null
          details: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          target_title?: string | null
          target_code?: string | null
          details?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          target_title?: string | null
          target_code?: string | null
          details?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          document_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          document_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          document_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}

// Helper interfaces for joined queries
export interface DocumentWithOwner {
  id: string
  title: string
  code: string
  type: DocType
  version: string
  description: string | null
  content: string | null
  tags: string[]
  status: DocStatus
  owner_id: string | null
  created_at: string
  updated_at: string
  users?: {
    name: string
    initials: string | null
    avatar_color: string | null
  }
}

export interface DocumentWithVersions extends DocumentWithOwner {
  versions: Database['public']['Tables']['document_versions']['Row'][]
}

export interface DocumentWithApprovals extends DocumentWithOwner {
  approvals: Database['public']['Tables']['approvals']['Row'][]
}

export interface UserWithRole {
  id: string
  email: string
  name: string
  password_hash: string
  role_id: string | null
  department: string
  status: UserStatus
  initials: string | null
  avatar_color: string | null
  last_active_at: string | null
  created_at: string
  updated_at: string
  roles?: {
    name: UserRole
    permissions: string[]
  }
}