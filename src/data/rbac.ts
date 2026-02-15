import { supabase } from "@/lib/supabase"
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput } from "@/types/rbac"

// ============================================
// PERMISSIONS
// ============================================

export async function getAllPermissions() {
    return await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true })
        .order("action", { ascending: true })
}

export async function getPermissionsByModule(module: string) {
    return await supabase
        .from("permissions")
        .select("*")
        .eq("module", module)
        .order("action", { ascending: true })
}

// ============================================
// ROLES
// ============================================

export async function getAllRoles(organisationId?: string | null) {
    let query = supabase
        .from("roles")
        .select(`
            *,
            role_permissions(
                permission_id,
                permissions(*)
            )
        `)
        .order("created_at", { ascending: false })
    
    // Filter by organisation: show system roles (NULL org_id) and org-specific roles
    if (organisationId !== undefined) {
        query = query.or(`organisation_id.is.null,organisation_id.eq.${organisationId}`)
    }
    
    return await query
}

export async function getRoleById(roleId: string) {
    return await supabase
        .from("roles")
        .select(`
            *,
            role_permissions(
                permission_id,
                permissions(*)
            )
        `)
        .eq("id", roleId)
        .single()
}

export async function getSystemRoles() {
    return await supabase
        .from("roles")
        .select("*")
        .is("organisation_id", null)
        .eq("is_system_role", true)
        .eq("is_active", true)
        .order("display_name", { ascending: true })
}

export async function getOrganisationRoles(organisationId: string) {
    return await supabase
        .from("roles")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("is_active", true)
        .order("display_name", { ascending: true })
}

export async function createRole(data: CreateRoleInput) {
    const { permission_ids, ...roleData } = data
    
    // Insert role
    const { data: role, error: roleError } = await supabase
        .from("roles")
        .insert({
            ...roleData,
            is_system_role: false,
            is_active: true
        })
        .select()
        .single()
    
    if (roleError) return { data: null, error: roleError }
    
    // Insert role permissions
    if (permission_ids && permission_ids.length > 0) {
        const rolePermissions = permission_ids.map(permission_id => ({
            role_id: role.id,
            permission_id
        }))
        
        const { error: permError } = await supabase
            .from("role_permissions")
            .insert(rolePermissions)
        
        if (permError) return { data: null, error: permError }
    }
    
    return { data: role, error: null }
}

export async function updateRole(roleId: string, data: UpdateRoleInput) {
    const { permission_ids, ...roleData } = data
    
    // Update role
    const { data: role, error: roleError } = await supabase
        .from("roles")
        .update({
            ...roleData,
            updated_at: new Date().toISOString()
        })
        .eq("id", roleId)
        .select()
        .single()
    
    if (roleError) return { data: null, error: roleError }
    
    // Update role permissions
    if (permission_ids !== undefined) {
        // Delete existing permissions
        const { error: deleteError } = await supabase
            .from("role_permissions")
            .delete()
            .eq("role_id", roleId)
        
        if (deleteError) return { data: null, error: deleteError }
        
        // Insert new permissions
        if (permission_ids.length > 0) {
            const rolePermissions = permission_ids.map(permission_id => ({
                role_id: roleId,
                permission_id
            }))
            
            const { error: insertError } = await supabase
                .from("role_permissions")
                .insert(rolePermissions)
            
            if (insertError) return { data: null, error: insertError }
        }
    }
    
    return { data: role, error: null }
}

export async function deleteRole(roleId: string) {
    // Check if it's a system role
    const { data: role } = await supabase
        .from("roles")
        .select("is_system_role")
        .eq("id", roleId)
        .single()
    
    if (role?.is_system_role) {
        return { 
            data: null, 
            error: { 
                message: "Cannot delete system roles",
                code: "SYSTEM_ROLE_DELETE"
            } 
        }
    }
    
    return await supabase
        .from("roles")
        .delete()
        .eq("id", roleId)
        .select()
        .single()
}

// ============================================
// USER ROLES
// ============================================

export async function getUserRoles(userId: string) {
    return await supabase
        .from("user_roles")
        .select(`
            *,
            roles(*)
        `)
        .eq("user_id", userId)
}

export async function getUsersWithRoles(organisationId?: string) {
    let query = supabase
        .from("users")
        .select(`
            *,
            organisations(name),
            user_roles(
                *,
                roles(*)
            )
        `)
        .order("created_at", { ascending: false })
    
    if (organisationId) {
        query = query.eq("organisation_id", organisationId)
    }
    
    return await query
}

export async function assignRoleToUser(data: AssignRoleInput, assignedBy?: string) {
    return await supabase
        .from("user_roles")
        .insert({
            ...data,
            assigned_by: assignedBy
        })
        .select()
        .single()
}

export async function removeRoleFromUser(userId: string, roleId: string) {
    return await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", roleId)
}

export async function updateUserRoles(userId: string, roleIds: string[], assignedBy?: string) {
    // Delete existing roles
    const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
    
    if (deleteError) return { data: null, error: deleteError }
    
    // Insert new roles
    if (roleIds.length > 0) {
        const userRoles = roleIds.map(role_id => ({
            user_id: userId,
            role_id,
            assigned_by: assignedBy
        }))
        
        return await supabase
            .from("user_roles")
            .insert(userRoles)
            .select()
    }
    
    return { data: [], error: null }
}

// ============================================
// PERMISSION CHECKS
// ============================================

export async function getUserPermissions(userId: string) {
    const { data, error } = await supabase
        .from("user_roles")
        .select(`
            roles(
                role_permissions(
                    permissions(*)
                )
            )
        `)
        .eq("user_id", userId)
    
    if (error) return { data: null, error }
    
    // Flatten permissions from all roles
    const permissions = new Set<string>()
    data.forEach((userRole: any) => {
        userRole.roles?.role_permissions?.forEach((rp: any) => {
            if (rp.permissions?.name) {
                permissions.add(rp.permissions.name)
            }
        })
    })
    
    return { data: Array.from(permissions), error: null }
}

export async function checkUserPermission(userId: string, permissionName: string) {
    const { data: permissions, error } = await getUserPermissions(userId)
    
    if (error) return { hasPermission: false, error }
    
    return { 
        hasPermission: permissions?.includes(permissionName) || false, 
        error: null 
    }
}

export async function checkUserRole(userId: string, roleName: string) {
    const { data, error } = await supabase
        .from("user_roles")
        .select(`
            roles(name)
        `)
        .eq("user_id", userId)
    
    if (error) return { hasRole: false, error }
    
    const hasRole = data?.some((ur: any) => ur.roles?.name === roleName) || false
    return { hasRole, error: null }
}

// ============================================
// USER PERMISSIONS
// ============================================

export async function getUserDirectPermissions(userId: string) {
    return await supabase
        .from("user_permissions")
        .select(`
            permission_id,
            permissions(*)
        `)
        .eq("user_id", userId)
}

export async function assignUserPermission(userId: string, permissionId: string) {
    return await supabase
        .from("user_permissions")
        .insert({
            user_id: userId,
            permission_id: permissionId
        })
        .select()
        .single()
}

export async function removeUserPermission(userId: string, permissionId: string) {
    return await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("permission_id", permissionId)
}
