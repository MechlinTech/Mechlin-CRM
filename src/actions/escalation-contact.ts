"use server"
import { revalidatePath } from "next/cache"
import type { EscalationContact } from "@/types/rbac"

import {
    getEscalationContacts,
    updateEscalationContacts
} from "@/data/escalation-contacts"



// Escalation Contact Actions
export async function getEscalationContactsAction(organisationId: string) {
    const { data, error } = await getEscalationContacts(organisationId)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, escalationContacts: data.escalation_contacts }
}

export async function updateEscalationContactsAction(organisationId: string, contacts: EscalationContact[]) {
    const { error } = await updateEscalationContacts(organisationId, contacts)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/organisations")
    return { success: true }
}
