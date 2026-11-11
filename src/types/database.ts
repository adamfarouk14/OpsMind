// Database types matching Supabase schema

export type DocType = 'SOP' | 'Technical Document' | 'Operational Case' | 'Org Info'
export type DocStatus = 'Draft' | 'In Review' | 'Approved' | 'Rejected'
export type ApprovalStatus = 'Not Started' | 'Pending' | 'Approved' | 'Rejected'
export type UserRole = 'Admin' | 'Manager' | 'Support Agent'
export type UserStatus = 'Active' | 'Inactive'
export type DeviceCategory =
  | 'POS' | 'Interactive Display' | 'Printer' | 'Laptop' | 'Computer'
  | 'Monitor' | 'Barcode Scanner' | 'Mobile' | 'Server' | 'Network' | 'Other'
export type DeviceStatus = 'Active' | 'Archived'
export type AttachmentStatus = 'pending' | 'available'

// One stored file tied to one document or one version of it. `version_id: null`
// means the live document row, not "every version".
export interface DocumentAttachment {
  id: string
  document_id: string
  version_id: string | null
  storage_bucket: string
  storage_path: string
  uploaded_by: string
  file_name: string | null
  status: AttachmentStatus
  created_at: string
}

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
          username: string
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
          username: string
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
          username?: string
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
          file_path: string | null
          file_name: string | null
          title: string | null
          description: string | null
          content: string | null
          type: string | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          document_id: string
          version: string
          author_id?: string | null
          notes?: string | null
          created_at?: string
          file_path?: string | null
          file_name?: string | null
          title?: string | null
          description?: string | null
          content?: string | null
          type?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          document_id?: string
          version?: string
          author_id?: string | null
          notes?: string | null
          created_at?: string
          file_path?: string | null
          file_name?: string | null
          title?: string | null
          description?: string | null
          content?: string | null
          type?: string | null
          status?: string | null
          tags?: string[] | null
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
      devices: {
        Row: {
          id: string
          name: string
          manufacturer: string
          model_number: string
          category: DeviceCategory
          description: string | null
          specifications: string | null
          status: DeviceStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          manufacturer: string
          model_number: string
          category?: DeviceCategory
          description?: string | null
          specifications?: string | null
          status?: DeviceStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          manufacturer?: string
          model_number?: string
          category?: DeviceCategory
          description?: string | null
          specifications?: string | null
          status?: DeviceStatus
          created_at?: string
          updated_at?: string
        }
      }
      document_devices: {
        Row: {
          document_id: string
          device_id: string
          created_at: string
        }
        Insert: {
          document_id: string
          device_id: string
          created_at?: string
        }
        Update: {
          document_id?: string
          device_id?: string
          created_at?: string
        }
      }
      document_attachments: {
        Row: {
          id: string
          document_id: string
          version_id: string | null
          storage_bucket: string
          storage_path: string
          uploaded_by: string
          file_name: string | null
          status: AttachmentStatus
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version_id?: string | null
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
          file_name?: string | null
          status?: AttachmentStatus
          created_at?: string
        }
        Update: never
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
  username: string
  name: string
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

export interface Device {
  id: string
  name: string
  manufacturer: string
  model_number: string
  category: DeviceCategory
  description: string | null
  specifications: string | null
  status: DeviceStatus
  created_at: string
  updated_at: string
}

export interface DeviceWithDocuments extends Device {
  documents: DocumentWithOwner[]
}

export interface DocumentWithDevices extends DocumentWithOwner {
  devices: Device[]
}