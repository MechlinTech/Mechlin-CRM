"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getAllActiveUsersWithOrgsAction() {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(`
                id, 
                name, 
                organisation_id,
                organisations!inner (
                    name,
                    is_internal
                )
            `)
            .eq("status", "active");

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("Fetch Users Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getActiveMechlinUsersAction() {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(`id, name, organisations!inner(name)`)
            .eq('organisations.name', 'Mechlin')
            .eq('status', 'active');

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("Fetch Mechlin Users Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getAllProjectsAction() {
    try {
        const { data, error } = await supabase
            .from("projects")
            .select(`*, organisations(name), project_members(user_id)`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("Fetch Projects Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getAllOrganisationsAction() {
    try {
        const { data, error } = await supabase
            .from("organisations")
            .select("id, name");

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("Fetch Organisations Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createProjectAction(data: any) {
    const { members, ...projectData } = data;
    const { data: result, error } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    if (members?.length > 0) {
        const memberRows = members.map((userId: string) => ({
            project_id: result.id,
            user_id: userId,
        }));
        await supabase.from("project_members").insert(memberRows);
    }
    
    revalidatePath("/projects");
    return { success: true, data: result };
}

export async function updateProjectAction(id: string, data: any) {
    const { members, ...projectData } = data;
    const { data: result, error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    await supabase.from("project_members").delete().eq("project_id", id);
    if (members?.length > 0) {
        const memberRows = members.map((userId: string) => ({
            project_id: id,
            user_id: userId,
        }));
        await supabase.from("project_members").insert(memberRows);
    }
    
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true, data: result };
}

export async function deleteProjectAction(id: string) {
    await supabase.from("project_members").delete().eq("project_id", id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/projects");
    return { success: true };
}