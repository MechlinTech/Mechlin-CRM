"use client"

import { EnquiryThread } from './EnquiryThread'
import { useAuth } from '@/hooks/useAuth'

interface GeneralThreadsProps {
    currentUserId?: string
    title?: string
    showThreadList?: boolean
    defaultView?: 'list' | 'create' | 'thread'
}

export function GeneralThreads({ 
    currentUserId,
    title = "Community Discussions",
    showThreadList = true,
    defaultView = "list"
}: GeneralThreadsProps) {
    const { user } = useAuth()
    
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view community discussions.
            </div>
        )
    }

    return (
        <EnquiryThread
            contextType="general"
            currentUserId={userId}
            title={title}
            showThreadList={showThreadList}
            defaultView={defaultView}
        />
    )
}