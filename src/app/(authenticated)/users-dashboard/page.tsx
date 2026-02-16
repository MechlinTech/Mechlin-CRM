"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Building, Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useRBAC } from "@/context/rbac-context" // Added RBAC Integration to match structure

export default function ClientDashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // RBAC Hook to match Organisation Detail Page structure
  const { hasPermission, loading: rbacLoading } = useRBAC();

  React.useEffect(() => {
    if (user) fetchUserProjects()
  }, [user])

  async function fetchUserProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('project_members')
      .select(`
        project_id,
        projects!inner (
          *,
          organisations (*)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    const projectData = data?.map(item => item.projects) || []
    setProjects(projectData)
    setLoading(false)
  }

  if (loading || rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-10">
          
          <div className="space-y-6">
            {/* Header Section - Exactly matched to Organisation Detail UI */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">My Projects</h2>
                  <p className="text-sm text-[#0F172A]/60">Projects assigned to you</p>
                </div>
                <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                  {hasPermission('projects.read') ? projects.length : 0}
                </Badge>
              </div>
            </div>

            {/* Project Grid - Exactly matched to Organisation Detail UI */}
            {hasPermission('projects.read') && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/projects/${project.id}`}
                    className="group block p-6 bg-white/80 backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#006AFF] transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg tracking-tight group-hover:text-[#006AFF] line-clamp-2 text-[#0F172A]">
                          {project.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            project.status === 'Active'
                              ? 'border-green-500/30 text-green-600 bg-green-50'
                              : project.status === 'Pending'
                              ? 'border-yellow-500/30 text-yellow-600 bg-yellow-50'
                              : project.status === 'Suspended'
                              ? 'border-red-500/30 text-red-600 bg-red-50'
                              : 'border-gray-300 text-gray-600 bg-gray-50'
                          }`}
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-[#0F172A]">
                        {/* Organization Name Row - Consistent with Organisation Detail metadata list */}
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-3.5 w-3.5 text-[#006AFF]" />
                          <span className="truncate">{project.organisations?.name || 'No Organization'}</span>
                        </div>

                        {project.budget && (
                          <div className="flex items-center gap-2"> 
                            <DollarSign className="h-3.5 w-3.5 text-[#006AFF]" />
                            <p className="font-medium">{project.currency || 'USD'}: {project.budget.toLocaleString()}</p>
                          </div>
                        )}
                        {project.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#006AFF]" />
                            <span className="tracking-wider">Start: {project.start_date}</span>
                          </div>
                        )}
                        {project.expected_end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#006AFF]" />
                            <span className="tracking-wider">End: {project.expected_end_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State - Exactly matched to Organisation Detail UI */
              <div className="text-center py-20">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-lg mb-6">
                  <Building className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900">
                  {hasPermission('projects.read') ? "No Projects Yet" : "Access Restricted"}
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  {hasPermission('projects.read') 
                    ? "You haven't been assigned to any projects yet." 
                    : "You do not have the required permissions to view projects."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}