import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getUserRBAC() {
    console.log('🔍 getUserRBAC called')
    
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

    // Get user roles and permissions
    const { data, error } = await supabase
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
    
    console.log('🔎 RBAC query result:', { data, error: error?.message })
    
    if (error) {
        console.error('Error fetching RBAC data:', error)
        return {
            roles: [],
            permissions: [],
            userId: user.id
        }
    }

    const roles = new Set<string>()
    const permissions = new Set<string>()
    
    data?.forEach((userRole: any) => {
        if (userRole.roles?.name) {
            roles.add(userRole.roles.name)
        }
        
        userRole.roles?.role_permissions?.forEach((rp: any) => {
            if (rp.permissions?.name) {
                permissions.add(rp.permissions.name)
            }
        })
    })

    const result = {
        roles: Array.from(roles),
        permissions: Array.from(permissions),
        userId: user.id
    }
    
    console.log('📋 Final RBAC result:', result)
    return result
}
