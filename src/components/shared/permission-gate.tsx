"use client"

import { ReactNode } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import type { PermissionName } from "@/types/rbac"

interface PermissionGateProps {
    children: ReactNode
    permission?: PermissionName
    permissions?: PermissionName[]
    role?: string
    roles?: string[]
    requireAll?: boolean // If true, user needs ALL permissions/roles; if false, needs ANY
    fallback?: ReactNode
    loading?: ReactNode
}

/**
 * Component to conditionally render content based on user permissions or roles
 * 
 * Usage:
 * <PermissionGate permission="projects.create">
 *   <CreateProjectButton />
 * </PermissionGate>
 * 
 * <PermissionGate permissions={["projects.create", "projects.update"]} requireAll={false}>
 *   <ProjectActions />
 * </PermissionGate>
 * 
 * <PermissionGate role="admin">
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    permission,
    permissions,
    role,
    roles,
    requireAll = false,
    fallback = null,
    loading: loadingComponent = null,
}: PermissionGateProps) {
    const {
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        hasAnyRole,
        loading,
    } = usePermissions()

    if (loading) {
        return <>{loadingComponent}</>
    }

    let hasAccess = false

    // Check single permission
    if (permission) {
        hasAccess = hasPermission(permission)
    }
    // Check multiple permissions
    else if (permissions && permissions.length > 0) {
        hasAccess = requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions)
    }
    // Check single role
    else if (role) {
        hasAccess = hasRole(role)
    }
    // Check multiple roles
    else if (roles && roles.length > 0) {
        hasAccess = hasAnyRole(roles)
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Simpler component for permission-based rendering
 */
export function HasPermission({ 
    permission, 
    children 
}: { 
    permission: PermissionName
    children: ReactNode 
}) {
    return (
        <PermissionGate permission={permission}>
            {children}
        </PermissionGate>
    )
}

/**
 * Simpler component for role-based rendering
 */
export function HasRole({ 
    role, 
    children 
}: { 
    role: string
    children: ReactNode 
}) {
    return (
        <PermissionGate role={role}>
            {children}
        </PermissionGate>
    )
}

/**
 * Component to show content only to admins
 */
export function AdminOnly({ children }: { children: ReactNode }) {
    return (
        <PermissionGate roles={["super_admin", "admin"]}>
            {children}
        </PermissionGate>
    )
}

/**
 * Component to show content only to super admins
 */
export function SuperAdminOnly({ children }: { children: ReactNode }) {
    return (
        <PermissionGate role="super_admin">
            {children}
        </PermissionGate>
    )
}
