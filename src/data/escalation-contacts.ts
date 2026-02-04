import { supabase } from "@/lib/supabase"
import type { EscalationContact } from "@/types/rbac"

export async function getEscalationContacts(organisationId: string) {
    return await supabase.from("organisations")
        .select("escalation_contacts")
        .eq("id", organisationId)
        .single()
}

export async function updateEscalationContacts(organisationId: string, contacts: EscalationContact[]) {
    return await supabase.from("organisations")
        .update({ 
            escalation_contacts: contacts,
            updated_at: new Date().toISOString()
        })
        .eq("id", organisationId)
        .select().single()
}
  