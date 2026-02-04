import { supabase } from "@/lib/supabase"

export type Thread = {
    id: string
    title: string
    context_type: 'project' | 'support' | 'user' | 'general'
    context_id?: string | null
    status: 'open' | 'in_progress' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    created_by: string
    is_public: boolean
    created_at: string
    updated_at: string
    last_message_at: string
}

export type Message = {
    id: string
    thread_id: string
    content: string
    message_type: 'text' | 'system' | 'file'
    created_by: string
    created_at: string
}

export type Participant = {
    id: string
    thread_id: string
    user_id: string
    joined_at: string
    user?: {
        id: string
        name?: string
        email?: string
        avatar_url?: string
    }
}

export type Attachment = {
    id: string
    message_id: string
    thread_id: string
    filename: string
    file_path: string
    file_size: number
    mime_type: string
    uploaded_by: string
    created_at: string
}

export type CreateThreadInput = {
    title: string
    context_type: 'project' | 'support' | 'user' | 'general'
    context_id?: string | null
    status?: 'open' | 'in_progress' | 'closed'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    created_by: string
    is_public?: boolean
}

export type UpdateThreadInput = {
    title?: string
    status?: 'open' | 'in_progress' | 'closed'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    is_public?: boolean
    last_message_at?: string
}

export type CreateMessageInput = {
    thread_id: string
    content: string
    message_type?: 'text' | 'system' | 'file'
    created_by: string
}

export type CreateAttachmentInput = {
    message_id: string
    thread_id: string
    filename: string
    file_path: string
    file_size: number
    mime_type: string
    uploaded_by: string
}

// Get all threads with optional context filtering
export async function getAllThreads(contextType?: string, contextId?: string) {
    let query = supabase
        .from('enquiry_threads')
        .select('*')
        .order('last_message_at', { ascending: false })

    if (contextType) {
        query = query.eq('context_type', contextType)
    }
    if (contextId) {
        query = query.eq('context_id', contextId)
    }

    const { data, error } = await query

    return { data, error }
}

// Get thread by ID
export async function getThreadById(id: string) {
    const { data, error } = await supabase
        .from('enquiry_threads')
        .select('*')
        .eq('id', id)
        .single()

    return { data, error }
}

// Create new thread
export async function createThread(threadData: CreateThreadInput) {
    const { data, error } = await supabase
        .from('enquiry_threads')
        .insert({
            title: threadData.title,
            context_type: threadData.context_type,
            context_id: threadData.context_id || null,
            status: threadData.status || 'open',
            priority: threadData.priority || 'medium',
            created_by: threadData.created_by,
            is_public: threadData.is_public !== false, // Default to true
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
        })
        .select()
        .single()

    return { data, error }
}

// Update thread
export async function updateThread(id: string, threadData: UpdateThreadInput) {
    const updateData: any = {
        updated_at: new Date().toISOString()
    }
    
    if (threadData.title !== undefined) updateData.title = threadData.title
    if (threadData.status !== undefined) updateData.status = threadData.status
    if (threadData.priority !== undefined) updateData.priority = threadData.priority
    if (threadData.is_public !== undefined) updateData.is_public = threadData.is_public

    const { data, error } = await supabase
        .from('enquiry_threads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    return { data, error }
}

// Delete thread
export async function deleteThread(id: string) {
    const { error } = await supabase
        .from('enquiry_threads')
        .delete()
        .eq('id', id)

    return { error }
}

// Get messages by thread
export async function getMessagesByThread(threadId: string) {
    const { data, error } = await supabase
        .from('enquiry_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

    return { data, error }
}

// Create message
export async function createMessage(messageData: CreateMessageInput) {
    const { data, error } = await supabase
        .from('enquiry_messages')
        .insert({
            thread_id: messageData.thread_id,
            content: messageData.content,
            message_type: messageData.message_type || 'text',
            created_by: messageData.created_by
        })
        .select()
        .single()

    return { data, error }
}

// Get participants by thread
export async function getParticipantsByThread(threadId: string) {
    const { data, error } = await supabase
        .from('thread_participants')
        .select('*')
        .eq('thread_id', threadId)

    return { data, error }
}

// Add participant to thread
export async function addParticipant(threadId: string, userId: string) {
    const { data, error } = await supabase
        .from('thread_participants')
        .upsert({
            thread_id: threadId,
            user_id: userId,
            joined_at: new Date().toISOString()
        })
        .select()
        .single()

    return { data, error }
}

// Get participant count
export async function getParticipantCount(threadId: string) {
    const { count, error } = await supabase
        .from('thread_participants')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', threadId)

    return { count: count || 0, error }
}

// Get attachments by thread
export async function getAttachmentsByThread(threadId: string) {
    const { data, error } = await supabase
        .from('thread_attachments')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })

    return { data, error }
}

// Get attachments by message
export async function getAttachmentsByMessage(messageId: string) {
    const { data, error } = await supabase
        .from('thread_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false })

    return { data, error }
}

// Create attachment
export async function createAttachment(attachmentData: CreateAttachmentInput) {
    const { data, error } = await supabase
        .from('thread_attachments')
        .insert({
            message_id: attachmentData.message_id,
            thread_id: attachmentData.thread_id,
            filename: attachmentData.filename,
            file_path: attachmentData.file_path,
            file_size: attachmentData.file_size,
            mime_type: attachmentData.mime_type,
            uploaded_by: attachmentData.uploaded_by
        })
        .select()
        .single()

    return { data, error }
}

// Delete attachment
export async function deleteAttachment(id: string) {
    const { error } = await supabase
        .from('thread_attachments')
        .delete()
        .eq('id', id)

    return { error }
}
