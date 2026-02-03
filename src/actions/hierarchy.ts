"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// --- PHASE ACTIONS ---
export async function createPhaseAction(projectId: string, name: string) {
    const { error } = await supabase.from("phases").insert([{ project_id: projectId, name }]);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updatePhaseAction(phaseId: string, projectId: string, name: string) {
    const { error } = await supabase.from("phases").update({ name }).eq("id", phaseId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deletePhaseAction(phaseId: string, projectId: string) {
    const { error } = await supabase.from("phases").delete().eq("id", phaseId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// --- MILESTONE ACTIONS ---
export async function createMilestoneAction(phaseId: string, projectId: string, data: any) {
    const { error } = await supabase.from("milestones").insert([{ ...data, phase_id: phaseId }]);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updateMilestoneAction(milestoneId: string, projectId: string, data: any) {
    const { error } = await supabase.from("milestones").update(data).eq("id", milestoneId);
    if (error) return { success: false, error: error.message };
    
    await supabase.from("activity_logs").insert({
        target_id: milestoneId,
        target_type: 'milestone',
        action_type: 'UPDATE',
        new_data: { status: data.status }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteMilestoneAction(milestoneId: string, projectId: string) {
    const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// --- SPRINT ACTIONS ---
export async function createSprintAction(milestoneId: string, projectId: string, data: any) {
    const { error } = await supabase.from("sprints").insert([{ ...data, milestone_id: milestoneId }]);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteSprintAction(sprintId: string, projectId: string) {
    const { error } = await supabase.from("sprints").delete().eq("id", sprintId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}