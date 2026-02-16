"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function uploadDocumentAction(projectId: string, data: any) {
    const { error } = await supabase.from("documents").insert([{
        project_id: projectId,
        ...data,
        status: 'Approved' 
    }]);

    if (error) return { success: false, error: error.message };
    
    // FIX: Revalidate the documents sub-page as well
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/documents`); 
    return { success: true };
}

export async function deleteDocumentAction(docId: string, projectId: string) {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) return { success: false, error: error.message };
    
    // FIX: Revalidate both paths
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/documents`);
    return { success: true };
}