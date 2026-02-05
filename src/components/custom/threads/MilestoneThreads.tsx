"use client"

import { EnquiryThread } from './EnquiryThread'
import { useAuth } from '@/hooks/useAuth'

interface MilestoneThreadsProps {
    milestoneId: string
    currentUserId?: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function MilestoneThreads({ 
    milestoneId, 
    currentUserId,
    title = "Milestone Discussions",
    showThreadList = true,
    defaultView = "list"
}: MilestoneThreadsProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view milestone threads.
            </div>
        )
    }

    return (
        <EnquiryThread
            contextType="project"
            contextId={milestoneId}
            currentUserId={userId}
            title={title}
            showThreadList={showThreadList}
            defaultView={defaultView}
        />
    )
}
