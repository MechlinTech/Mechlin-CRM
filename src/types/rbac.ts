// ============================================
// RBAC Type Definitions
// ============================================

export interface Permission {
    id: string
    name: string // e.g., 'projects.create', 'users.read'
    display_name: string
    description: string | null
    module: string // e.g., 'projects', 'users'
    action: string // e.g., 'create', 'read', 'update', 'delete'
    created_at: string
    updated_at: string
}

export interface Role {
    id: string
    organisation_id: string | null
    name: string
    display_name: string
    description: string | null
    permissions?: Permission[] // Populated via join
    is_active: boolean
    is_system_role: boolean
    created_at: string
    updated_at: string
}

export interface RolePermission {
    id: string
    role_id: string
    permission_id: string
    created_at: string
}

export interface UserRole {
    id: string
    user_id: string
    role_id: string
    assigned_by: string | null
    assigned_at: string
    role?: Role // Populated via join
}

export interface UserWithRoles {
    id: string
    organisation_id: string | null
    name: string
    email: string
    status: string
    roles?: Role[]
    user_roles?: UserRole[]
    created_at: string
    updated_at: string
}

// Permission check types
export type PermissionName = string // e.g., 'projects.create'
export type ModuleName = 'projects' | 'users' | 'organisations' | 'roles' | 'documents' | 
                         'invoices' | 'wiki' | 'threads' | 'phases' | 'milestones' | 'sprints'
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage'

// Form input types
export interface CreateRoleInput {
    name: string
    display_name: string
    description?: string
    organisation_id?: string | null
    permission_ids: string[]
}

export interface UpdateRoleInput extends CreateRoleInput {
    is_active?: boolean
}

export interface AssignRoleInput {
    user_id: string
    role_id: string
}

// Escalation Contact Types (existing)
export interface EscalationContact {
    name: string
    email: string
    phone?: string
}