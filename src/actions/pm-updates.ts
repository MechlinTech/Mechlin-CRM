"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function createPMUpdateAction(projectId: string, content: string) {
    // FIX: Changed table name to 'status_logs'
    const { error } = await supabase.from("status_logs").insert([{
        target_id: projectId,
        target_type: 'project',
        action_type: 'PM_UPDATE',
        new_data: { content }
    }]);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function updatePMUpdateAction(logId: string, projectId: string, content: string) {
    // FIX: Changed table name to 'status_logs'
    const { error } = await supabase.from("status_logs")
        .update({ new_data: { content } })
        .eq("id", logId);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deletePMUpdateAction(logId: string, projectId: string) {
    // FIX: Changed table name to 'status_logs'
    const { error } = await supabase.from("status_logs").delete().eq("id", logId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}