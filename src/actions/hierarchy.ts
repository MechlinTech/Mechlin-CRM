"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Helper to log audit trail events
async function logAuditEvent(targetId: string, type: string, action: string, data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("status_logs").insert([{
        target_id: targetId,
        target_type: type,
        action_type: action,
        new_value: data,
        changed_by: user?.id || null // Automatically attribute to logged-in user
    }]);

}

// --- PHASE ACTIONS ---
export async function createPhaseAction(projectId: string, name: string) {
    const { data, error } = await supabase.from("phases").insert([{ project_id: projectId, name }]).select().single();
    if (error) return { success: false, error: error.message };
    await logAuditEvent(projectId, 'project', 'PHASE_CREATED', { details: `Phase "${name}" was created.` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updatePhaseAction(phaseId: string, projectId: string, name: string) {
    const { error } = await supabase.from("phases").update({ name }).eq("id", phaseId);
    if (error) return { success: false, error: error.message };
    await logAuditEvent(projectId, 'project', 'PHASE_UPDATED', { details: `Phase updated to "${name}"` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deletePhaseAction(phaseId: string, projectId: string) {
    const { error } = await supabase.from("phases").delete().eq("id", phaseId);
    if (error) return { success: false, error: error.message };
    await logAuditEvent(projectId, 'project', 'PHASE_DELETED', { details: `A project phase was removed.` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// --- MILESTONE ACTIONS ---
// --- MILESTONE ACTIONS ---
export async function createMilestoneAction(phaseId: string, projectId: string, data: any) {
    const { data: milestone, error } = await supabase.from("milestones").insert([{ ...data, phase_id: phaseId }]).select().single();
    if (error) return { success: false, error: error.message };
    await logAuditEvent(milestone.id, 'milestone', 'MILESTONE_CREATED', { details: `Milestone "${data.name}" initialized.` });
    
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// FIX: Synchronized parameters with the form and added specific path revalidation
export async function updateMilestoneAction(milestoneId: string, projectId: string, data: any) {
    const { error } = await supabase.from("milestones").update(data).eq("id", milestoneId);
    if (error) return { success: false, error: error.message };

    await logAuditEvent(milestoneId, 'milestone', 'UPDATE', { 
        status: data.status, 
        details: `Milestone "${data.name}" updated.` 
    });

    // This forces the Project page AND the specific Milestone page to refresh
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/phases/[phaseId]/milestones/${milestoneId}`, 'page');
    
    return { success: true };
}

export async function deleteMilestoneAction(milestoneId: string, projectId: string) {
    const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);
    if (error) return { success: false, error: error.message };
    await logAuditEvent(projectId, 'project', 'MILESTONE_DELETED', { details: `A milestone was removed.` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// --- SPRINT ACTIONS ---
export async function createSprintAction(milestoneId: string, projectId: string, data: any) {
    const { data: sprint, error } = await supabase.from("sprints").insert([{ ...data, milestone_id: milestoneId }]).select().single();
    if (error) return { success: false, error: error.message };
    await logAuditEvent(milestoneId, 'milestone', 'SPRINT_CREATED', { details: `New sprint "${data.name}" added.` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updateSprintAction(sprintId: string, projectId: string, data: any) {
    const { error } = await supabase.from("sprints").update(data).eq("id", sprintId);
    if (error) return { success: false, error: error.message };
    await logAuditEvent(sprintId, 'sprint', 'SPRINT_UPDATED', { details: `Sprint "${data.name}" details updated.` });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteSprintAction(sprintId: string, projectId: string) {
    const { error } = await supabase.from("sprints").delete().eq("id", sprintId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

// --- TASK ACTIONS ---
export async function createTaskAction(data: any) {
    const { data: task, error } = await supabase.from("tasks").insert([data]).select().single();
    if (error) return { success: false, error: error.message };
    await logAuditEvent(data.sprint_id, 'sprint', 'TASK_CREATED', { details: `Task "${data.title}" added to sprint.` });
    revalidatePath(`/projects/${data.project_id}`);
    return { success: true };
}

export async function updateTaskAction(taskId: string, projectId: string, data: any) {
    const { error } = await supabase.from("tasks").update(data).eq("id", taskId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteTaskAction(taskId: string, projectId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };

}