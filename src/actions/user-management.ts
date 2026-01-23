"use server"

import { revalidatePath } from "next/cache"
import { getAllOrganisations, createOrganisation, updateOrganisation, deleteOrganisation } from "@/data/organisations"

// Organisation type - represents the full organisation record from the database
export type Organisation = {
    id: string
    name: string
    slug: string
    status: "active" | "suspended" | "trial"
    created_at: string
    updated_at: string
}

// Input type for creating a new organisation (only manual fields)
export type CreateOrganisationInput = {
    name: string
    slug: string
    status: "active" | "suspended" | "trial"
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