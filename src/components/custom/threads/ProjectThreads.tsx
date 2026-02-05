"use client"

import { EnquiryThread } from './EnquiryThread'
import { useAuth } from '@/hooks/useAuth'

interface ProjectThreadsProps {
    projectId: string
    currentUserId?: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function ProjectThreads({ 
    projectId, 
    currentUserId,
    title = "Project Discussions",
    showThreadList = true,
    defaultView = "list"
}: ProjectThreadsProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view project threads.
            </div>
        )
    }

    return (
        <EnquiryThread
            contextType="project"
            contextId={projectId}
            currentUserId={userId}
            title={title}
            showThreadList={showThreadList}
            defaultView={defaultView}
        />
    )
}
