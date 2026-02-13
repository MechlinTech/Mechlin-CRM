"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"
import { getUserPermissions, getUserRoles, hasPermission, hasRole } from "@/lib/permissions"
import type { PermissionName } from "@/types/rbac"

interface UsePermissionsReturn {
    permissions: string[]
    roles: string[]
    loading: boolean
    hasPermission: (permission: PermissionName) => boolean
    hasRole: (role: string) => boolean
    hasAnyPermission: (permissions: PermissionName[]) => boolean
    hasAllPermissions: (permissions: PermissionName[]) => boolean
    hasAnyRole: (roles: string[]) => boolean
    isAdmin: boolean
    isSuperAdmin: boolean
    refetch: () => Promise<void>
}

/**
 * Hook to check user permissions and roles
 * Caches permissions for performance
 */
export function usePermissions(): UsePermissionsReturn {
    const { user, loading: authLoading } = useAuth()
    const [permissions, setPermissions] = useState<string[]>([])
    const [roles, setRoles] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchPermissions()
        } else {
            setPermissions([])
            setRoles([])
            setLoading(false)
        }
    }, [user])

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const [perms, userRoles] = await Promise.all([
                getUserPermissions(),
                getUserRoles()
            ])
            setPermissions(perms)
            setRoles(userRoles)
        } catch (error) {
            console.error("Error fetching permissions:", error)
            setPermissions([])
            setRoles([])
        } finally {
            setLoading(false)
        }
    }

    const checkPermission = (permission: PermissionName): boolean => {
        return permissions.includes(permission)
    }

    const checkRole = (role: string): boolean => {
        return roles.includes(role)
    }

    const checkAnyPermission = (perms: PermissionName[]): boolean => {
        return perms.some(p => permissions.includes(p))
    }

    const checkAllPermissions = (perms: PermissionName[]): boolean => {
        return perms.every(p => permissions.includes(p))
    }

    const checkAnyRole = (roleNames: string[]): boolean => {
        return roleNames.some(r => roles.includes(r))
    }

    const isAdmin = checkAnyRole(["super_admin", "admin"])
    const isSuperAdmin = checkRole("super_admin")

    return {
        permissions,
        roles,
        loading: authLoading || loading,
        hasPermission: checkPermission,
        hasRole: checkRole,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        hasAnyRole: checkAnyRole,
        isAdmin,
        isSuperAdmin,
        refetch: fetchPermissions,
    }
}
