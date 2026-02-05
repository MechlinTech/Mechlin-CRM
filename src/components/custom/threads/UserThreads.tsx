"use client"

import { EnquiryThread } from './EnquiryThread'
import { useAuth } from '@/hooks/useAuth'

interface UserThreadsProps {
    userId: string
    currentUserId?: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function UserThreads({ 
    userId, 
    currentUserId,
    title = "User Messages",
    showThreadList = true,
    defaultView = "list"
}: UserThreadsProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const loggedInUserId = currentUserId || user?.id

    if (!loggedInUserId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view user threads.
            </div>
        )
    }

    return (
        <EnquiryThread
            contextType="user"
            contextId={userId}
            currentUserId={loggedInUserId}
            title={title}
            showThreadList={showThreadList}
            defaultView={defaultView}
        />
    )
}
