"use client"

import { ProjectWikiList } from './ProjectWikiList'
import { useAuth } from '@/hooks/useAuth'

interface GeneralWikiProps {
    currentUserId?: string
    title?: string
    showHeader?: boolean
}

export function GeneralWiki({ 
    currentUserId,
    title = "General Wiki",
    showHeader = true
}: GeneralWikiProps) {
    const { user } = useAuth()
    
    // If currentUserId not provided, use authenticated user
    const userId = currentUserId || user?.id

    if (!userId) {
        return (
            <div className="text-center py-8 text-gray-600">
                Please log in to view the wiki.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {showHeader && (
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-gray-600">Company documentation and knowledge base</p>
                </div>
            )}
            
            <ProjectWikiList 
                projectId={null} // null for general wiki (no project)
                currentUserId={userId}
                title={title}
                showHeader={showHeader}
            />
        </div>
    )
}
