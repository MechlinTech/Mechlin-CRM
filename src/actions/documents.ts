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
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteDocumentAction(docId: string, projectId: string) {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}