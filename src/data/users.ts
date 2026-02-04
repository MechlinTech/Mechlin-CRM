import { supabase } from "@/lib/supabase"
import type { CreateUserInput } from "@/actions/user-management"

export async function getAllUsers() {
    return await supabase.from("users").select("*, organisations(name)")
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
