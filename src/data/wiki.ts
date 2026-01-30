import { supabase } from "@/lib/supabase"

export type WikiPage = {
    id: string
    title: string
    content: any // JSON content from Tiptap
    slug: string
    parent_id?: string | null
    order_index: number
    status: 'draft' | 'published' | 'archived'
    created_by?: string | null
    updated_by?: string | null
    created_at: string
    updated_at: string
    children?: WikiPage[] // For hierarchical structure
}

export type WikiVersion = {
    id: string
    page_id: string
    content: any
    changes_summary?: string
    created_by?: string | null
    created_at: string
}

export type CreateWikiPageInput = {
    title: string
    content: any
    slug: string
    parent_id?: string | null
    order_index?: number
    status?: 'draft' | 'published' | 'archived'
    created_by?: string | null
}

export type UpdateWikiPageInput = {
    title?: string
    content?: any
    slug?: string
    parent_id?: string | null
    order_index?: number
    status?: 'draft' | 'published' | 'archived'
    updated_by?: string | null
}

// Get all wiki pages (with optional hierarchy)
export async function getAllWikiPages(includeHierarchy = false) {
    let query = supabase
        .from('wiki_pages')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) {
        return { data: null, error }
    }

    // Build hierarchy if requested
    let processedData = data
    if (includeHierarchy && data) {
        processedData = buildWikiHierarchy(data)
    }

    return { data: processedData, error: null }
}

// Get wiki page by ID
export async function getWikiPageById(id: string) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('id', id)
        .single()

    return { data, error }
}

// Get wiki page by slug
export async function getWikiPageBySlug(slug: string) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .single()

    return { data, error }
}

// Create new wiki page
export async function createWikiPage(pageData: CreateWikiPageInput) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .insert({
            title: pageData.title,
            content: pageData.content,
            slug: pageData.slug,
            parent_id: pageData.parent_id || null,
            order_index: pageData.order_index || 0,
            status: pageData.status || 'published',
            created_by: pageData.created_by || null
        })
        .select()
        .single()

    return { data, error }
}

// Update wiki page
export async function updateWikiPage(id: string, pageData: UpdateWikiPageInput) {
    const updateData: any = {
        updated_at: new Date().toISOString()
    }
    
    if (pageData.title !== undefined) updateData.title = pageData.title
    if (pageData.content !== undefined) updateData.content = pageData.content
    if (pageData.slug !== undefined) updateData.slug = pageData.slug
    if (pageData.parent_id !== undefined) updateData.parent_id = pageData.parent_id
    if (pageData.order_index !== undefined) updateData.order_index = pageData.order_index
    if (pageData.status !== undefined) updateData.status = pageData.status
    if (pageData.updated_by !== undefined) updateData.updated_by = pageData.updated_by

    const { data, error } = await supabase
        .from('wiki_pages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    return { data, error }
}

// Delete wiki page
export async function deleteWikiPage(id: string) {
    const { error } = await supabase
        .from('wiki_pages')
        .delete()
        .eq('id', id)

    return { error }
}

// Get page versions (history) - only get the immediate previous version
export async function getWikiPageVersions(pageId: string): Promise<WikiVersion[]> {
    try {
        const { data, error } = await supabase
            .from('wiki_versions')
            .select('*')
            .eq('page_id', pageId)
            .order('created_at', { ascending: false })
            .limit(1) // Only get the most recent version (which is the previous content)
        
        if (error) throw error
        
        return data || []
    } catch (error) {
        console.error('Error fetching wiki page versions:', error)
        throw error
    }
}

// Create page version (for history tracking)
export async function createWikiVersion(versionData: {
    page_id: string
    content: any
    changes_summary?: string
    created_by?: string
}) {
    const { data, error } = await supabase
        .from('wiki_versions')
        .insert({
            page_id: versionData.page_id,
            content: versionData.content,
            changes_summary: versionData.changes_summary || null,
            created_by: versionData.created_by || null
        })
        .select()
        .single()

    return { data, error }
}

// Clean up old versions - keep only the last 1 (previous version)
export async function cleanupOldVersions(pageId: string) {
    try {
        // Get all versions except the last 1
        const { data: allVersions } = await supabase
            .from('wiki_versions')
            .select('id')
            .eq('page_id', pageId)
            .order('created_at', { ascending: false })
        
        if (allVersions && allVersions.length > 1) {
            // Delete versions beyond the last 1
            const versionsToDelete = allVersions.slice(1).map(v => v.id)
            
            const { error } = await supabase
                .from('wiki_versions')
                .delete()
                .in('id', versionsToDelete)
            
            if (error) throw error
        }
        
        return { success: true }
    } catch (error) {
        console.error('Error cleaning up old versions:', error)
        return { success: false, error }
    }
}

// Search wiki pages
export async function searchWikiPages(searchTerm: string) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,content::text.ilike.%${searchTerm}%`)
        .eq('status', 'published')
        .order('updated_at', { ascending: false })

    return { data, error: null }
}

// Helper function to build hierarchical structure
function buildWikiHierarchy(pages: WikiPage[]): WikiPage[] {
    const pageMap = new Map<string, WikiPage>()
    const rootPages: WikiPage[] = []

    // Create map of all pages
    pages.forEach(page => {
        pageMap.set(page.id, { ...page, children: [] })
    })

    // Build hierarchy
    pages.forEach(page => {
        const pageWithChildren = pageMap.get(page.id)!
        if (page.parent_id && pageMap.has(page.parent_id)) {
            const parent = pageMap.get(page.parent_id)!
            parent.children!.push(pageWithChildren)
        } else {
            rootPages.push(pageWithChildren)
        }
    })

    return rootPages
}

// Generate unique slug from title
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}
