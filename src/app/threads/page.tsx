"use client"

import { useState, useEffect } from 'react'
import { EnquiryThread } from '@/components/custom/threads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface Project {
    id: string
    name: string
    status: string
}

export default function ThreadsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'project' | 'support'>('general')
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [projectsLoading, setProjectsLoading] = useState(false)
    const { user, loading } = useAuth()

    // Fetch projects when component mounts
    useEffect(() => {
        if (user) {
            fetchProjects()
        }
    }, [user])

    const fetchProjects = async () => {
        setProjectsLoading(true)
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, status')
                .order('name')

            if (error) {
                console.error('Error fetching projects:', error)
            } else {
                setProjects(data || [])
                // Auto-select first project if available
                if (data && data.length > 0) {
                    setSelectedProjectId(data[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setProjectsLoading(false)
        }
    }

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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Project Threads</h2>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                                    Select Project:
                                </label>
                                <Select
                                    value={selectedProjectId || ""}
                                    onValueChange={setSelectedProjectId}
                                    disabled={projectsLoading || projects.length === 0}
                                >
                                    <SelectTrigger className="w-64" id="project-select">
                                        <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select a project"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{project.name}</span>
                                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                        project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                        project.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {projects.length === 0 && !projectsLoading ? (
                            <div className="text-center py-8 text-gray-600">
                                <p>No projects found. Create a project first to start project-specific threads.</p>
                                <Button 
                                    className="mt-4" 
                                    onClick={() => window.location.href = '/projects'}
                                >
                                    Go to Projects
                                </Button>
                            </div>
                        ) : selectedProjectId ? (
                            <EnquiryThread
                                contextType="project"
                                contextId={selectedProjectId}
                                currentUserId={user.id}
                                title={`Project Discussions - ${projects.find(p => p.id === selectedProjectId)?.name}`}
                                showThreadList={true}
                                defaultView="list"
                            />
                        ) : (
                            <div className="text-center py-8 text-gray-600">
                                <p>Please select a project to view its threads.</p>
                            </div>
                        )}
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
