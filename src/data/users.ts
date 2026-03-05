import { supabase } from "@/lib/supabase"
import type { CreateUserInput } from "@/actions/user-management"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function getAllUsers(organisationId?: string, client?: SupabaseClient<any, "public", any>) {
    const db = client || supabase
    let query = db
        .from("users")
        .select(`
            *,
            organisations(name),
            user_roles!user_roles_user_id_fkey(
                id,
                role_id,
                roles(
                    id,
                    name,
                    display_name,
                    role_permissions!role_permissions_role_id_fkey(
                        permission_id,
                        permissions(
                            id,
                            display_name,
                            module,
                            action
                        )
                    )
                )
            ),
            user_permissions!user_permissions_user_id_fkey(
                permission_id,
                permissions(
                    id,
                    display_name,
                    module,
                    action
                )
            )
        `)
    
    // Filter by organisation_id if provided
    if (organisationId) {
        query = query.eq("organisation_id", organisationId)
    }
    
    const result = await query.order("created_at", { ascending: false })
    
    // Filter out empty arrays for cleaner response
    if (result.data) {
        result.data = result.data.map((user: any) => {
            return {
                ...user,
                user_roles: user.user_roles && user.user_roles.length > 0 ? user.user_roles : undefined,
                user_permissions: user.user_permissions && user.user_permissions.length > 0 ? user.user_permissions : undefined
            }
        })
    }
    
    return result
}

export async function createUser(data: CreateUserInput) {
    return await supabase.from("users").insert(data).select().single()
}

export async function updateUser(id: string, data: CreateUserInput) {
    return await supabase
        .from("users")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
}

export async function deleteUser(id: string) {
    return await supabase.from("users").delete().eq("id", id).select().single()
}
