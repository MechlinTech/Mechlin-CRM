"use client"

import { EnquiryThread } from './EnquiryThread'
import { useAuth } from '@/hooks/useAuth'

interface SprintThreadsProps {
    sprintId: string
    currentUserId?: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function SprintThreads({ 
    sprintId, 
    currentUserId,
    title = "Sprint Discussions",
    showThreadList = true,
    defaultView = "list"
}: SprintThreadsProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view sprint threads.
            </div>
        )
    }

    return (
        <EnquiryThread
            contextType="project"
            contextId={sprintId}
            currentUserId={userId}
            title={title}
            showThreadList={showThreadList}
            defaultView={defaultView}
        />
    )
}
