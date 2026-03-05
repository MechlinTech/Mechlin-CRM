"use client"

import React from 'react'
import { supabase } from "@/lib/supabase"
import { ProjectsTable } from "@/components/custom/projects/projects-table"
import { AddProjectButton } from "@/components/custom/projects/add-project-button"
import { redirect } from "next/navigation";
import { useRBAC } from "@/context/rbac-context"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'
import { Loader2, FolderKanban } from 'lucide-react'
import { getActiveMechlinUsersAction, getAllProjectsAction, getAllOrganisationsAction } from "@/actions/projects"

export default function ProjectsPage() {
    const [projects, setProjects] = React.useState<any[]>([])
    const [organisations, setOrganisations] = React.useState<any[]>([])
    const [users, setUsers] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions
            const canRead = hasPermission('projects.read')
            const isInternal = hasPermission('organisations.read') // Simple check for internal user
            
            if (!isInternal || !canRead) {
                redirect('/unauthorized')
                return
            }

            try {
                // Fetch projects
                const projectsResult = await getAllProjectsAction()
                const projectsData = projectsResult.success ? projectsResult.data : []

                // Fetch organisations
                const organisationsResult = await getAllOrganisationsAction()
                const organisationsData = organisationsResult.success ? organisationsResult.data : []

                // Fetch users where the organization name is 'Mechlin'
                const usersResult = await getActiveMechlinUsersAction()
                const usersData = usersResult.success ? usersResult.data : []

                setProjects(projectsData || [])
                setOrganisations(organisationsData || [])
                setUsers(usersData || [])
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (!rbacLoading) {
            fetchData()
        }
    }, [rbacLoading, hasPermission])

    const canCreate = hasPermission('projects.create')

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-0">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-heading-primary">All Projects</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage your project portfolio</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-heading-primary border-[#006AFF]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {projects?.length || 0}
                            </div>
                        </div>
                        {/* RBAC: Only show Add button if user has projects.create permission */}
                        {canCreate && <AddProjectButton 
                            organisations={organisations || []} 
                            users={users || []} 
                        />}
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2">
                        <ProjectsTable 
                            projects={projects || []} 
                            organisations={organisations || []}
                            users={users || []}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}