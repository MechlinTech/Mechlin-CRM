"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function uploadDocumentAction(projectId: string, data: any) {
    const { error } = await supabase.from("documents").insert([{
        project_id: projectId,
        phase_id: data.phase_id, // Added phase_id support
        milestone_id: data.milestone_id,
        sprint_id: data.sprint_id,
        name: data.name,
        file_url: data.file_url,
        doc_type: data.doc_type,
        status: 'Approved' 
    }]);

    if (error) return { success: false, error: error.message };
    
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/documents`); 
    return { success: true };
}

export async function deleteDocumentAction(docId: string, projectId: string) {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) return { success: false, error: error.message };
    
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/documents`);
    return { success: true };
}