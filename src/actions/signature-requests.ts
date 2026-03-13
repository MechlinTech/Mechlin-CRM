"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { sendSignatureRequestEmail } from "@/lib/signature-email-service"

async function createActionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function requestSignatureAction(projectId: string, docIds: string[], memberIds: string[]) {
  const supabase = await createActionClient();

  // 1. Get current Auth user
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "Not authenticated" };

  // 2. Fetch Requester name from users table
  const { data: requesterProfile } = await supabase
    .from("users")
    .select("name")
    .eq("id", auth.user.id)
    .single();

  // Resolve name: DB name → auth metadata → email prefix fallback
  const requesterName =
    requesterProfile?.name ||
    auth.user.user_metadata?.full_name ||
    auth.user.user_metadata?.name ||
    auth.user.email?.split("@")[0] ||
    "Someone";

  // 3. Get Document details
  const { data: docs } = await supabase.from("documents").select("id, name").in("id", docIds);
  if (!docs || docs.length === 0) return { success: false, error: "Documents not found" };

  // 4. Prepare database inserts for assignments
  const allInserts = docIds.flatMap(docId =>
    memberIds.map(userId => ({
      document_id: docId,
      user_id: userId,
      status: 'pending'
    }))
  );

  const { error: upsertError } = await supabase
    .from("document_signers")
    .upsert(allInserts, { onConflict: 'document_id,user_id' });
  if (upsertError) return { success: false, error: upsertError.message };

  // 5. Send Emails
  const { data: signers } = await supabase.from("users").select("name, email").in("id", memberIds);

  if (signers && docs) {
    for (const doc of docs) {
      for (const signer of signers) {
        await sendSignatureRequestEmail({
          to: signer.email,
          signerName: signer.name,
          requesterName,          // ← just the name, no role
          documentName: doc.name,
          projectId
        });
      }
    }
  }

  revalidatePath(`/projects/${projectId}/documents`);
  return { success: true };
}