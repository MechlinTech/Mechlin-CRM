import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkUserPermission, checkUserRole } from './permissions'
import type { PermissionName } from '@/types/rbac'

/**
 * Get authenticated user from server-side
 */
export async function getAuthUser() {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log("getAuthUser: Error:", error)
    console.log("getAuthUser: User:", user)
    
    if (error || !user) {
        return null
    }

    return user
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
    const user = await getAuthUser()
    
    if (!user) {
        redirect('/')
    }
    
    return user
}

/**
 * Require specific permission - redirect to unauthorized page if missing
 */
export async function requirePermission(
    permission: PermissionName,
    redirectTo: string = '/unauthorized'
) {
    const user = await requireAuth()
    const hasPermission = await checkUserPermission(user.id, permission)
    
    if (!hasPermission) {
        redirect(redirectTo)
    }
    
    return user
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
    permissions: PermissionName[],
    redirectTo: string = '/unauthorized'
) {
    const user = await requireAuth()
    
    const checks = await Promise.all(
        permissions.map(p => checkUserPermission(user.id, p))
    )
    
    const hasAnyPermission = checks.some(result => result)
    
    if (!hasAnyPermission) {
        redirect(redirectTo)
    }
    
    return user
}

/**
 * Require all specified permissions
 */
export async function requireAllPermissions(
    permissions: PermissionName[],
    redirectTo: string = '/unauthorized'
) {
    const user = await requireAuth()
    
    const checks = await Promise.all(
        permissions.map(p => checkUserPermission(user.id, p))
    )
    
    const hasAllPermissions = checks.every(result => result)
    
    if (!hasAllPermissions) {
        redirect(redirectTo)
    }
    
    return user
}

/**
 * Require specific role - redirect to unauthorized page if missing
 */
export async function requireRole(
    role: string,
    redirectTo: string = '/unauthorized'
) {
    const user = await requireAuth()
    const hasRole = await checkUserRole(user.id, role)
    
    if (!hasRole) {
        redirect(redirectTo)
    }
    
    return user
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(
    roles: string[],
    redirectTo: string = '/unauthorized'
) {
    const user = await requireAuth()
    
    const checks = await Promise.all(
        roles.map(r => checkUserRole(user.id, r))
    )
    
    const hasAnyRole = checks.some(result => result)
    
    if (!hasAnyRole) {
        redirect(redirectTo)
    }
    
    return user
}

/**
 * Require admin access (Super Admin or Admin role)
 */
export async function requireAdmin(redirectTo: string = '/unauthorized') {
    return requireAnyRole(['super_admin', 'admin'], redirectTo)
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin(redirectTo: string = '/unauthorized') {
    return requireRole('super_admin', redirectTo)
}

/**
 * Check permission without redirecting - returns boolean
 */
export async function checkPermission(permission: PermissionName): Promise<boolean> {
    const user = await getAuthUser()
    
    if (!user) {
        return false
    }
    
    return checkUserPermission(user.id, permission)
}

/**
 * Check role without redirecting - returns boolean
 */
export async function checkRole(role: string): Promise<boolean> {
    const user = await getAuthUser()
    
    if (!user) {
        return false
    }
    
    return checkUserRole(user.id, role)
}

/**
 * Get user permissions for server-side use
 */
export async function getServerUserPermissions(): Promise<string[]> {
    const user = await getAuthUser()
    
    if (!user) {
        return []
    }
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

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
}

/**
 * Check if user is internal (Mechlin member) for server-side use
 */
export async function getServerIsInternalUser(): Promise<boolean> {
    const user = await getAuthUser()
    
    if (!user) {
        console.log("getServerIsInternalUser: No user found")
        return false
    }
    
    console.log("getServerIsInternalUser: User ID:", user.id)
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data, error } = await supabase
        .from("users")
        .select(`
            organisations(is_internal)
        `)
        .eq("id", user.id)
        .single()
    
    console.log("getServerIsInternalUser: Query error:", error)
    console.log("getServerIsInternalUser: Query data:", data)
    
    if (error) {
        console.log("getServerIsInternalUser: Returning false due to error")
        return false
    }
    
    const isInternal = (data as any)?.organisations?.is_internal || false
    console.log("getServerIsInternalUser: Final is_internal value:", isInternal)
    return isInternal
}
