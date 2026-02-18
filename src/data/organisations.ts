import { supabase } from "@/lib/supabase"
import type { CreateOrganisationInput } from "@/actions/user-management"

export async function getAllOrganisations() {
    return await supabase.from("organisations").select("*")
}

export async function getAllOrganisationsWithProjectCounts() {
    // Use a single optimized query with left joins to include all organisations
    const { data: organisations, error: orgError } = await supabase
        .from("organisations")
        .select(`
            *,
            projects (
              id
            )
        `)
        .order('created_at', { ascending: false })

    if (orgError) {
        console.error('Error fetching organisations:', orgError)
        return { data: [], error: orgError }
    }

    if (!organisations) {
        return { data: [], error: null }
    }

    // Transform the data to extract project counts from the joined data
    const organisationsWithCounts = organisations.map(org => ({
        ...org,
        project_count: org.projects?.length || 0
    }))

    return { data: organisationsWithCounts, error: null }
}

export async function createOrganisation(data: CreateOrganisationInput) {
    return await supabase.from("organisations").insert({
        ...data,
        escalation_contacts: data.escalation_contacts || []
    }).select().single()
}

export async function updateOrganisation(id: string, data: CreateOrganisationInput) {
    // Only update the provided fields and explicitly set updated_at to current timestamp
    // created_at should never be updated - it's only set on creation
    return await supabase
        .from("organisations")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
}

export async function deleteOrganisation(id: string) {
    return await supabase.from("organisations").delete().eq("id", id).select().single()
}