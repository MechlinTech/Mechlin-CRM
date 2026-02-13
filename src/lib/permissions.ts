import { supabase } from "@/lib/supabase"
import type { PermissionName, ModuleName, ActionType } from "@/types/rbac"

// ============================================
// CLIENT-SIDE PERMISSION UTILITIES
// ============================================

/**
 * Check if the current user has a specific permission
 * @param permissionName - Permission name in format 'module.action' (e.g., 'projects.create')
 * @returns Promise<boolean>
 */
export async function hasPermission(permissionName: PermissionName): Promise<boolean> {
    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return false
        
        // Get user's permissions
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(
                    role_permissions(
                        permissions(name)
                    )
                )
            `)
            .eq("user_id", user.id)
        
        if (error) return false
        
        // Check if permission exists in any of user's roles
        const hasPermission = data?.some((userRole: any) => 
            userRole.roles?.role_permissions?.some((rp: any) => 
                rp.permissions?.name === permissionName
            )
        )
        
        return hasPermission || false
    } catch (error) {
        console.error("Error checking permission:", error)
        return false
    }
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * @param permissions - Array of permission names
 * @returns Promise<boolean>
 */
export async function hasAnyPermission(permissions: PermissionName[]): Promise<boolean> {
    const checks = await Promise.all(permissions.map(p => hasPermission(p)))
    return checks.some(result => result)
}

/**
 * Check if user has all specified permissions (AND logic)
 * @param permissions - Array of permission names
 * @returns Promise<boolean>
 */
export async function hasAllPermissions(permissions: PermissionName[]): Promise<boolean> {
    const checks = await Promise.all(permissions.map(p => hasPermission(p)))
    return checks.every(result => result)
}

/**
 * Check if the current user has a specific role
 * @param roleName - Role name (e.g., 'admin', 'super_admin')
 * @returns Promise<boolean>
 */
export async function hasRole(roleName: string): Promise<boolean> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return false
        
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(name)
            `)
            .eq("user_id", user.id)
        
        if (error) return false
        
        return data?.some((ur: any) => ur.roles?.name === roleName) || false
    } catch (error) {
        console.error("Error checking role:", error)
        return false
    }
}

/**
 * Check if user has any of the specified roles (OR logic)
 * @param roles - Array of role names
 * @returns Promise<boolean>
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
    const checks = await Promise.all(roles.map(r => hasRole(r)))
    return checks.some(result => result)
}

/**
 * Get all permissions for the current user
 * @returns Promise<string[]> - Array of permission names
 */
export async function getUserPermissions(): Promise<string[]> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return []
        
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(
                    role_permissions(
                        permissions(name)
                    )
                )
            `)
            .eq("user_id", user.id)
        
        if (error) return []
        
        const permissions = new Set<string>()
        data?.forEach((userRole: any) => {
            userRole.roles?.role_permissions?.forEach((rp: any) => {
                if (rp.permissions?.name) {
                    permissions.add(rp.permissions.name)
                }
            })
        })
        
        return Array.from(permissions)
    } catch (error) {
        console.error("Error fetching user permissions:", error)
        return []
    }
}

/**
 * Get all roles for the current user
 * @returns Promise<string[]> - Array of role names
 */
export async function getUserRoles(): Promise<string[]> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return []
        
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(name, display_name)
            `)
            .eq("user_id", user.id)
        
        if (error) return []
        
        return data?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
    } catch (error) {
        console.error("Error fetching user roles:", error)
        return []
    }
}

/**
 * Check if user is a Super Admin
 * @returns Promise<boolean>
 */
export async function isSuperAdmin(): Promise<boolean> {
    return hasRole("super_admin")
}

/**
 * Check if user is an Admin (Super Admin or Admin)
 * @returns Promise<boolean>
 */
export async function isAdmin(): Promise<boolean> {
    return hasAnyRole(["super_admin", "admin"])
}

/**
 * Check if user is internal (Mechlin member)
 * @returns Promise<boolean>
 */
export async function isInternalUser(): Promise<boolean> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return false
        
        const { data, error } = await supabase
            .from("users")
            .select(`
                organisations(is_internal)
            `)
            .eq("id", user.id)
            .single()
        
        if (error) return false
        
        return (data as any)?.organisations?.is_internal || false
    } catch (error) {
        console.error("Error checking internal user:", error)
        return false
    }
}

/**
 * Build a permission name from module and action
 * @param module - Module name (e.g., 'projects')
 * @param action - Action type (e.g., 'create')
 * @returns string - Permission name (e.g., 'projects.create')
 */
export function buildPermissionName(module: ModuleName, action: ActionType): PermissionName {
    return `${module}.${action}`
}

// ============================================
// SERVER-SIDE PERMISSION UTILITIES
// ============================================

/**
 * Check permission for a specific user (server-side)
 * @param userId - User ID
 * @param permissionName - Permission name
 * @returns Promise<boolean>
 */
export async function checkUserPermission(userId: string, permissionName: PermissionName): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(
                    role_permissions(
                        permissions(name)
                    )
                )
            `)
            .eq("user_id", userId)
        
        if (error) return false
        
        return data?.some((userRole: any) => 
            userRole.roles?.role_permissions?.some((rp: any) => 
                rp.permissions?.name === permissionName
            )
        ) || false
    } catch (error) {
        console.error("Error checking user permission:", error)
        return false
    }
}

/**
 * Check if user has specific role (server-side)
 * @param userId - User ID
 * @param roleName - Role name
 * @returns Promise<boolean>
 */
export async function checkUserRole(userId: string, roleName: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from("user_roles")
            .select(`
                roles(name)
            `)
            .eq("user_id", userId)
        
        if (error) return false
        
        return data?.some((ur: any) => ur.roles?.name === roleName) || false
    } catch (error) {
        console.error("Error checking user role:", error)
        return false
    }
}
