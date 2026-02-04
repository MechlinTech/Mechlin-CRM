"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function createInvoiceAction(projectId: string, data: { invoice_number: string, amount: number, status: string, file_url: string, storage_path: string }) {
    const { error } = await supabase.from("invoices").insert([{
        project_id: projectId,
        ...data 
    }]);

    if (error) return { success: false, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteInvoiceAction(invoiceId: string, projectId: string, storagePath?: string) {
    // 1. Delete from Database
    const { error: dbError } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (dbError) return { success: false, error: dbError.message };

    // 2. Delete from Storage if path exists
    if (storagePath) {
        await supabase.storage.from('invoices').remove([storagePath]);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}