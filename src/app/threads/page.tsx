"use client"

import { useState } from 'react'
import { EnquiryThread } from '@/components/custom/threads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function ThreadsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'project' | 'support'>('general')
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading...</div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Please log in to view threads.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-4 border-b">
                    <button
                        className={`pb-2 px-1 ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General Discussions
                    </button>
                    <button
                        className={`pb-2 px-1 ${activeTab === 'project' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('project')}
                    >
                        Project Threads
                    </button>
                    <button
                        className={`pb-2 px-1 ${activeTab === 'support' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('support')}
                    >
                        Support Threads
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'general' && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4">General Discussions</h2>
                        <EnquiryThread
                            contextType="general"
                            currentUserId={user.id}
                            title="Community Discussions"
                            showThreadList={true}
                            defaultView="list"
                        />
                    </div>
                )}

                {activeTab === 'project' && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4">Project Threads</h2>
                        <EnquiryThread
                            contextType="project"
                            contextId="project-123"
                            currentUserId={user.id}
                            title="Project Discussions"
                            showThreadList={true}
                            defaultView="list"
                        />
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4">Support Threads</h2>
                        <EnquiryThread
                            contextType="support"
                            currentUserId={user.id}
                            title="Support Tickets"
                            showThreadList={true}
                            defaultView="list"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
