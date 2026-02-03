"use client"

import { ProjectWikiList } from './ProjectWikiList'
import { useAuth } from '@/hooks/useAuth'

interface ProjectWikiProps {
    projectId: string
    currentUserId?: string
    title?: string
    showHeader?: boolean
}

export function ProjectWiki({ 
    projectId, 
    currentUserId,
    title = "Project Wiki",
    showHeader = true
}: ProjectWikiProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view the project wiki.
            </div>
        )
    }

    return (
        <ProjectWikiList 
            projectId={projectId}
            currentUserId={userId}
            title={title}
            showHeader={showHeader}
        />
    )
}
