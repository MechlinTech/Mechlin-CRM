import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper function to create Supabase client
async function createSupabaseServerClient() {
    const cookieStore = await cookies()
    
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Handle cookie setting errors
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // Handle cookie removal errors
                    }
                },
            },
        }
    )
}

// Simple function to check if user is authenticated and get basic info
export async function getAuthenticatedUser() {
    console.log('🔍 getAuthenticatedUser called')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Auth check:', { 
        userId: user?.id, 
        email: user?.email,
        role: user?.role,
        error: authError?.message 
    })
    
    if (authError || !user) {
        console.log('❌ Not authenticated')
        return {
            isAuthenticated: false,
            user: null,
            error: authError?.message || 'No user found'
        }
    }

    console.log('✅ User is authenticated')
    return {
        isAuthenticated: true,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
            lastSignIn: user.last_sign_in_at
        },
        error: null
    }
}

export async function getUserRBAC() {
    console.log('🔍 getUserRBAC called')
    
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Auth result:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
        console.log('❌ No authenticated user found')
        return {
            roles: [],
            permissions: [],
            userId: null
        }
    }

    console.log('✅ User authenticated:', user.id)

    // Get user roles and role-based permissions
    const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
            roles (
                name,
                role_permissions (
                    permissions (name)
                )
            )
        `)
        .eq("user_id", user.id)
    
    console.log('🔎 Role-based permissions query result:', { 
        data: rolesData, 
        error: rolesError?.message 
    })

    // Get direct user permissions
    const { data: userPermsData, error: userPermsError } = await supabase
        .from("user_permissions")
        .select(`
            permissions (name)
        `)
        .eq("user_id", user.id)
    
    console.log('🔎 Direct user permissions query result:', { 
        data: userPermsData, 
        error: userPermsError?.message 
    })
    
    if (rolesError) {
        console.error('Error fetching role-based permissions:', rolesError)
    }
    
    if (userPermsError) {
        console.error('Error fetching direct user permissions:', userPermsError)
    }

    const roles = new Set<string>()
    const permissions = new Set<string>()
    
    // Process role-based permissions
    rolesData?.forEach((userRole: any) => {
        if (userRole.roles?.name) {
            roles.add(userRole.roles.name)
        }
        
        userRole.roles?.role_permissions?.forEach((rp: any) => {
            if (rp.permissions?.name) {
                permissions.add(rp.permissions.name)
            }
        })
    })

    // Process direct user permissions
    userPermsData?.forEach((userPerm: any) => {
        if (userPerm.permissions?.name) {
            permissions.add(userPerm.permissions.name)
        }
    })

    const result = {
        roles: Array.from(roles),
        permissions: Array.from(permissions),
        userId: user.id
    }
    
    console.log('📋 Final RBAC result:', result)
    console.log('📊 Permissions breakdown:', {
        roleBasedPermissions: rolesData?.flatMap((ur: any) => 
            ur.roles?.role_permissions?.map((rp: any) => rp.permissions?.name) || []
        ).filter(Boolean) || [],
        directPermissions: userPermsData?.map((up: any) => up.permissions?.name).filter(Boolean) || [],
        totalUnique: result.permissions.length
    })
    
    return result
}
