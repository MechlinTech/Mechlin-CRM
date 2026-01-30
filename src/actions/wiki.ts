"use server"

import { revalidatePath } from "next/cache"
import { 
    getAllWikiPages, 
    getWikiPageById, 
    createWikiPage, 
    updateWikiPage, 
    deleteWikiPage,
    getWikiPageVersions,
    createWikiVersion,
    searchWikiPages,
    generateSlug,
    type WikiPage,
    type CreateWikiPageInput,
    type UpdateWikiPageInput
} from "@/data/wiki"

// Get wiki page by slug (helper function)
async function getWikiPageBySlug(slug: string) {
    const { supabase } = await import("@/lib/supabase")
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .single()

    return { data, error }
}

// Get all wiki pages
export async function getAllWikiPagesAction(includeHierarchy = false) {
    const { data, error } = await getAllWikiPages(includeHierarchy)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch pages' }
    }
    return { success: true, pages: data }
}

// Get wiki page by ID
export async function getWikiPageByIdAction(id: string) {
    const { data, error } = await getWikiPageById(id)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch page' }
    }
    return { success: true, page: data }
}

// Get wiki page by slug
export async function getWikiPageBySlugAction(slug: string) {
    const { data, error } = await getWikiPageBySlug(slug)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch page' }
    }
    return { success: true, page: data }
}

// Create new wiki page
export async function createWikiPageAction(pageData: CreateWikiPageInput & { created_by?: string }) {
    // Generate slug if not provided
    if (!pageData.slug && pageData.title) {
        pageData.slug = generateSlug(pageData.title)
    }

    const { data, error } = await createWikiPage(pageData)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to create page', code: (error as any)?.code }
    }

    // Create initial version without user tracking
    if (data) {
        await createWikiVersion({
            page_id: data.id,
            content: pageData.content,
            changes_summary: "Initial version"
        })
    }

    revalidatePath("/wiki")
    return { success: true, page: data }
}

// Update wiki page
export async function updateWikiPageAction(
    id: string, 
    pageData: UpdateWikiPageInput & { updated_by?: string, changes_summary?: string }
) {
    // Get current page for version history
    const { data: currentPage } = await getWikiPageById(id)
    
    const { data, error } = await updateWikiPage(id, pageData)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to update page', code: (error as any)?.code }
    }

    // Create version if content changed (no user tracking)
    if (data && currentPage && 
        JSON.stringify(currentPage.content) !== JSON.stringify(pageData.content)) {
        await createWikiVersion({
            page_id: id,
            content: pageData.content || currentPage.content,
            changes_summary: pageData.changes_summary || "Page updated"
        })
    }

    revalidatePath("/wiki")
    revalidatePath(`/wiki/${id}`)
    return { success: true, page: data }
}

// Delete wiki page
export async function deleteWikiPageAction(id: string) {
    const { error } = await deleteWikiPage(id)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to delete page' }
    }

    revalidatePath("/wiki")
    return { success: true }
}

// Get page versions
export async function getWikiPageVersionsAction(pageId: string) {
    const { data, error } = await getWikiPageVersions(pageId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch versions' }
    }
    return { success: true, versions: data }
}

// Search wiki pages
export async function searchWikiPagesAction(searchTerm: string) {
    const { data, error } = await searchWikiPages(searchTerm)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to search pages' }
    }
    return { success: true, pages: data }
}
