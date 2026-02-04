"use server"

import { revalidatePath } from "next/cache"
import { 
    getAllThreads,
    getThreadById,
    createThread,
    updateThread,
    deleteThread,
    getMessagesByThread,
    createMessage,
    getParticipantsByThread,
    addParticipant,
    getParticipantCount,
    getAttachmentsByThread,
    getAttachmentsByMessage,
    createAttachment,
    deleteAttachment,
    type Thread,
    type CreateThreadInput,
    type UpdateThreadInput,
    type CreateMessageInput,
    type CreateAttachmentInput
} from "@/data/threads"

// Get all threads with optional context filtering
export async function getAllThreadsAction(contextType?: string, contextId?: string) {
    const { data, error } = await getAllThreads(contextType, contextId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch threads' }
    }
    return { success: true, threads: data }
}

// Get thread by ID
export async function getThreadByIdAction(id: string) {
    const { data, error } = await getThreadById(id)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch thread' }
    }
    return { success: true, thread: data }
}

// Create new thread
export async function createThreadAction(threadData: CreateThreadInput) {
    const { data, error } = await createThread(threadData)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to create thread', code: (error as any)?.code }
    }

    // Add creator as participant
    if (data) {
        await addParticipant(data.id, threadData.created_by)
    }

    revalidatePath("/threads")
    return { success: true, thread: data }
}

// Update thread
export async function updateThreadAction(id: string, threadData: UpdateThreadInput) {
    const { data, error } = await updateThread(id, threadData)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to update thread', code: (error as any)?.code }
    }

    revalidatePath("/threads")
    revalidatePath(`/threads/${id}`)
    return { success: true, thread: data }
}

// Delete thread
export async function deleteThreadAction(id: string) {
    const { error } = await deleteThread(id)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to delete thread' }
    }

    revalidatePath("/threads")
    return { success: true }
}

// Get messages by thread
export async function getMessagesByThreadAction(threadId: string) {
    const { data, error } = await getMessagesByThread(threadId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch messages' }
    }
    return { success: true, messages: data }
}

// Create message
export async function createMessageAction(messageData: CreateMessageInput) {
    // Create the message
    const { data, error } = await createMessage(messageData)
    
    if (error) {
        console.error('Create message failed:', error)
        return { success: false, error: (error as any)?.message || 'Failed to create message', code: (error as any)?.code }
    }

    // Add participant (application logic)
    if (data) {
        await addParticipant(data.thread_id, messageData.created_by)
        
        // Update thread last_message_at
        await updateThread(data.thread_id, {
            last_message_at: new Date().toISOString()
        })
    }

    // Don't revalidatePath for smooth UX - let client handle updates
    return { success: true, message: data }
}

// Get participants by thread
export async function getParticipantsByThreadAction(threadId: string) {
    const { data, error } = await getParticipantsByThread(threadId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch participants' }
    }
    return { success: true, participants: data }
}

// Get participant count
export async function getParticipantCountAction(threadId: string) {
    const { count, error } = await getParticipantCount(threadId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to get participant count' }
    }
    return { success: true, count }
}

// Get attachments by thread
export async function getAttachmentsByThreadAction(threadId: string) {
    const { data, error } = await getAttachmentsByThread(threadId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch attachments' }
    }
    return { success: true, attachments: data }
}

// Get attachments by message
export async function getAttachmentsByMessageAction(messageId: string) {
    const { data, error } = await getAttachmentsByMessage(messageId)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to fetch attachments' }
    }
    return { success: true, attachments: data }
}

// Create attachment
export async function createAttachmentAction(attachmentData: CreateAttachmentInput) {
    const { data, error } = await createAttachment(attachmentData)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to create attachment', code: (error as any)?.code }
    }

    revalidatePath(`/threads/${attachmentData.thread_id}`)
    return { success: true, attachment: data }
}

// Delete attachment
export async function deleteAttachmentAction(id: string, threadId: string) {
    const { error } = await deleteAttachment(id)
    if (error) {
        return { success: false, error: (error as any)?.message || 'Failed to delete attachment' }
    }

    revalidatePath(`/threads/${threadId}`)
    return { success: true }
}
