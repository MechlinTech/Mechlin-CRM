"use server"

import { revalidatePath } from "next/cache"
import { getAllOrganisations, createOrganisation, updateOrganisation, deleteOrganisation } from "@/data/organisations"
import { getAllUsers, createUser, updateUser, deleteUser } from "@/data/users"


// Organisation type - represents the full organisation record from the database
export type Organisation = {
    id: string
    name: string
    slug: string
    status: "active" | "suspended" | "trial"
    escalation_contacts: EscalationContact[]
    created_at: string
    updated_at: string
}

// Escalation Contact type
export type EscalationContact = {
    name: string
    email: string
    phone?: string
}

// Input type for creating a new organisation (only manual fields)
export type CreateOrganisationInput = {
    name: string
    slug: string
    status: "active" | "suspended" | "trial"
    escalation_contacts?: EscalationContact[]
}

export async function getAllOrganisationsAction() {
    const { data, error } = await getAllOrganisations()
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, organisations: data }
}

export async function createOrganisationAction(organisationData: CreateOrganisationInput) {
    const { error } = await createOrganisation(organisationData)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/organisations")
    return { success: true }
}

export async function updateOrganisationAction(id: string, organisationData: CreateOrganisationInput) {
    const { error } = await updateOrganisation(id, organisationData)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/organisations")
    return { success: true }
}

export async function deleteOrganisationAction(id: string) {
    const { error } = await deleteOrganisation(id)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/organisations")
    return { success: true }
}



// User type - represents the full user record from the database
export type User = {
    id: string
    organisation_id: string
    name: string
    email: string
    status: "active" | "suspended"
    created_at: string
    updated_at: string
    organisations?: {
        name: string
    }
}

// Input type for creating a new user (only manual fields)
export type CreateUserInput = {
    organisation_id: string
    name: string
    email: string
    status: "active" | "suspended"
}

export async function getAllUsersAction() {
    const { data, error } = await getAllUsers()
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    return { success: true, users: data }
}

export async function createUserAction(userData: CreateUserInput) {
    const { error } = await createUser(userData)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    return { success: true }
}

export async function updateUserAction(id: string, userData: CreateUserInput) {
    const { error } = await updateUser(id, userData)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    return { success: true }
}

export async function deleteUserAction(id: string) {
    const { error } = await deleteUser(id)
    if (error) {
        return { success: false, error: error.message, code: error.code }
    }
    revalidatePath("/users")
    return { success: true }
}