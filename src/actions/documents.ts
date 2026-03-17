"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

import { sendSignatureRequestEmail } from "@/lib/signature-email-service"

export async function uploadDocumentAction(projectId: string, data: any) {
    // 1. Get Requester Info
    const { data: { user } } = await supabase.auth.getUser();
    const requesterName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "A Project Member";

    // 2. Insert Document Record
    const { data: doc, error: docError } = await supabase.from("documents").insert([{
        project_id: projectId,
        phase_id: data.phase_id,
        milestone_id: data.milestone_id,
        sprint_id: data.sprint_id,
        name: data.name,
        file_url: data.file_url,
        doc_type: data.doc_type,
        signature_status: (data.requested_signers?.length > 0) ? 'pending' : null,
        status: 'Approved' 
    }]).select().single();

    if (docError) {
        console.error("Document Insert Error:", docError);
        return { success: false, error: docError.message };
    }

    // 3. Handle Signature Requests
    if (data.requested_signers && data.requested_signers.length > 0) {
        console.log("Requested Signer IDs:", data.requested_signers);

        // Fetch user details specifically for the requested IDs
        const { data: signers, error: userError } = await supabase
            .from("users")
            .select("id, name, email")
            .in("id", data.requested_signers);

        if (userError) {
            console.error("Error fetching signers from DB:", userError);
        }

        if (signers && signers.length > 0) {
            console.log(`Found ${signers.length} signers in DB. Starting email loop...`);
            
            for (const signer of signers) {
                console.log(`Sending signature request to: ${signer.email}`);
                
                const emailSent = await sendSignatureRequestEmail({
                    to: signer.email,
                    signerName: signer.name,
                    requesterName: requesterName,
                    documentName: data.name,
                    projectId: projectId
                });

                if (!emailSent) {
                    console.error(`Failed to send email to ${signer.email}`);
                } else {
                    console.log(`✅ Email successfully sent to ${signer.email}`);
                }
            }
        } else {
            console.warn("No users were found in the database matching the provided IDs.");
        }
    }
    
    
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