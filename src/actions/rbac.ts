"use server"

import { revalidatePath } from "next/cache"
import {
    getAllPermissions,
    getPermissionsByModule,
    getAllRoles,
    getRoleById,
    getSystemRoles,
    getOrganisationRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser,
    updateUserRoles,
    getUserPermissions,
    checkUserPermission,
    checkUserRole,
    getUserDirectPermissions,
    assignUserPermission,
    removeUserPermission
} from "@/data/rbac"
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput } from "@/types/rbac"

// ============================================
// PERMISSIONS ACTIONS
// ============================================

export async function getAllPermissionsAction() {
    const { data, error } = await getAllPermissions()
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, permissions: data }
}

export async function getPermissionsByModuleAction(module: string) {
    const { data, error } = await getPermissionsByModule(module)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, permissions: data }
}

// ============================================
// ROLES ACTIONS
// ============================================

export async function getAllRolesAction(organisationId?: string | null) {
    const { data, error } = await getAllRoles(organisationId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, roles: data }
}

export async function getRoleByIdAction(roleId: string) {
    const { data, error } = await getRoleById(roleId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, role: data }
}

export async function getSystemRolesAction() {
    const { data, error } = await getSystemRoles()
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, roles: data }
}

export async function getOrganisationRolesAction(organisationId: string) {
    const { data, error } = await getOrganisationRoles(organisationId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, roles: data }
}

export async function createRoleAction(roleData: CreateRoleInput) {
    const { data, error } = await createRole(roleData)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/roles")
    return { success: true, role: data }
}

export async function updateRoleAction(roleId: string, roleData: UpdateRoleInput, userId?: string) {
    const { data, error } = await updateRole(roleId, roleData, userId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/roles")
    return { success: true, role: data }
}

export async function deleteRoleAction(roleId: string) {
    const { error } = await deleteRole(roleId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/roles")
    return { success: true }
}

// ============================================
// USER ROLES ACTIONS
// ============================================

export async function getUserRolesAction(userId: string) {
    const { data, error } = await getUserRoles(userId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, userRoles: data }
}

export async function getUsersWithRolesAction(organisationId?: string) {
    const { data, error } = await getUsersWithRoles(organisationId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, users: data }
}

export async function assignRoleToUserAction(
    assignmentData: AssignRoleInput,
    assignedBy?: string
) {
    const { data, error } = await assignRoleToUser(assignmentData, assignedBy)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    revalidatePath("/roles")
    return { success: true, userRole: data }
}

export async function removeRoleFromUserAction(userId: string, roleId: string) {
    const { error } = await removeRoleFromUser(userId, roleId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    revalidatePath("/roles")
    return { success: true }
}

export async function updateUserRolesAction(
    userId: string,
    roleIds: string[],
    assignedBy?: string
) {
    const { data, error } = await updateUserRoles(userId, roleIds, assignedBy)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    revalidatePath("/roles")
    return { success: true, userRoles: data }
}

// ============================================
// PERMISSION CHECK ACTIONS
// ============================================

export async function getUserPermissionsAction(userId: string) {
    const { data, error } = await getUserPermissions(userId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, permissions: data }
}

export async function checkUserPermissionAction(userId: string, permissionName: string) {
    const { hasPermission, error } = await checkUserPermission(userId, permissionName)
    if (error) {
        return { success: false, hasPermission: false, error: error.message }
    }
    return { success: true, hasPermission }
}

export async function checkUserRoleAction(userId: string, roleName: string) {
    const { hasRole, error } = await checkUserRole(userId, roleName)
    if (error) {
        return { success: false, hasRole: false, error: error.message }
    }
    return { success: true, hasRole }
}

// ============================================
// USER PERMISSIONS ACTIONS
// ============================================

export async function assignUserPermissionAction(userId: string, permissionId: string) {
    const { data, error } = await assignUserPermission(userId, permissionId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/user-permissions")
    return { success: true, data }
}

export async function removeUserPermissionAction(userId: string, permissionId: string) {
    const { error } = await removeUserPermission(userId, permissionId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/user-permissions")
    return { success: true }
}
