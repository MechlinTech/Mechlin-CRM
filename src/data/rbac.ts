import { supabase } from "@/lib/supabase"
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput } from "@/types/rbac"

// ============================================
// USER ORGANIZATION
// ============================================

export async function getUserOrganisation(userId: string) {
    return await supabase
        .from("users")
        .select("organisation_id")
        .eq("id", userId)
        .single()
}

export async function getUserOrganisationWithInternal(userId: string) {
    return await supabase
        .from("users")
        .select(`
            organisation_id,
            organisations(
                id,
                name,
                is_internal
            )
        `)
        .eq("id", userId)
        .single()
}

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

export async function updatePermission(permissionId: string, updates: { is_internal?: boolean }) {
    return await supabase
        .from("permissions")
        .update(updates)
        .eq("id", permissionId)
        .select()
        .single()
}

// ============================================
// ROLES
// ============================================

export async function enrichRolesWithOrganisationNames(roles: any[]) {
    // Get unique organization IDs from custom roles
    const orgIds = [...new Set(roles
        .filter(role => !role.is_system_role && role.organisation_id)
        .map(role => role.organisation_id)
    )]

    if (orgIds.length === 0) {
        return roles
    }

    // Fetch organization names
    const { data: organisations } = await supabase
        .from('organisations')
        .select('id, name')
        .in('id', orgIds)

    // Create a map of org ID to name
    const orgMap = new Map(
        organisations?.map(org => [org.id, org.name]) || []
    )

    // Enrich roles with organization names
    return roles.map(role => {
        if (!role.is_system_role && role.organisation_id) {
            return {
                ...role,
                organisation_name: orgMap.get(role.organisation_id) || 'Unknown Organization'
            }
        }
        return role
    })
}

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
    
    // Filter by organisation: show system roles (NULL org_id) and org-specific roles for the current org only
    if (organisationId !== undefined && organisationId !== null) {
        // Show system roles (organisation_id IS NULL) AND roles for this specific organisation
        query = query.or(`organisation_id.is.null,organisation_id.eq.${organisationId}`)
    } else if (organisationId === null) {
        // If organisationId is explicitly null, only show system roles
        query = query.is("organisation_id", null)
    }
    // If organisationId is undefined, don't filter (show all - for super admins only)
    
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

export async function createRole(data: CreateRoleInput, userId?: string) {
    const { permission_ids, ...roleData } = data
    
    // Get user's organization if organisation_id is not provided
    let finalRoleData = { ...roleData }
    
    if (!finalRoleData.organisation_id && userId) {
        const { data: userData } = await supabase
            .from("users")
            .select("organisation_id")
            .eq("id", userId)
            .single()
        
        if (userData?.organisation_id) {
            finalRoleData.organisation_id = userData.organisation_id
        }
    }
    
    // Ensure organisation_id is set for non-system roles
    if (!finalRoleData.organisation_id) {
        return { 
            data: null, 
            error: { 
                message: "Organization ID is required for creating custom roles",
                code: "ORGANIZATION_REQUIRED"
            } 
        }
    }
    
    // Insert role
    const { data: role, error: roleError } = await supabase
        .from("roles")
        .insert({
            ...finalRoleData,
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

export async function updateRole(roleId: string, data: UpdateRoleInput, userId?: string) {
    // Check if it's a system role and if user is admin (not super_admin)
    if (userId) {
        const [existingRole, userRoles] = await Promise.all([
            supabase
                .from("roles")
                .select("is_system_role")
                .eq("id", roleId)
                .single(),
            supabase
                .from("user_roles")
                .select("roles(name)")
                .eq("user_id", userId)
        ])

        const roles = userRoles.data?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
        const isAdmin = roles.includes("admin")
        const isSuperAdmin = roles.includes("super_admin")
        const isAdminOnly = isAdmin && !isSuperAdmin

        if (existingRole.data?.is_system_role && isAdminOnly) {
            return { 
                data: null, 
                error: { 
                    message: "Admin users cannot update system roles",
                    code: "ADMIN_SYSTEM_ROLE_UPDATE"
                } 
            }
        }
    } else {
        // Fallback: block all system role updates if no user context
        const { data: existingRole } = await supabase
            .from("roles")
            .select("is_system_role")
            .eq("id", roleId)
            .single()
        
        if (existingRole?.is_system_role) {
            return { 
                data: null, 
                error: { 
                    message: "Cannot update system roles",
                    code: "SYSTEM_ROLE_UPDATE"
                } 
            }
        }
    }

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
