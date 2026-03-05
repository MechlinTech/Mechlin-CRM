"use client"

import React, { useEffect } from 'react'
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
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto pt-6">
          
          <div className="space-y-6">
            {/* Header Section - Compact Modern Design */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">My Projects</h2>
                  <p className="text-xs text-[#0F172A]/60 mt-0.5">Projects assigned to you</p>
                </div>
                <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                  {hasPermission('projects.read') ? projects.length : 0}
                </Badge>
              </div>
            </div>

            {/* Project Grid - Compact Modern Cards */}
            {hasPermission('projects.read') && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/projects/${project.id}`}
                    className="group block p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-semibold text-[#0F172A] group-hover:text-[#006AFF] transition-colors line-clamp-2 tracking-tight">
                          {project.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
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

                      <div className="space-y-2">
                        {/* Organization Name Row */}
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                            <Building className="h-3 w-3 text-[#006AFF]" />
                          </div>
                          <span className="text-xs text-[#0F172A]/70 truncate">{project.organisations?.name || 'No Organization'}</span>
                        </div>

                        {project.budget && (
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                              <DollarSign className="h-3 w-3 text-[#006AFF]" />
                            </div>
                            <span className="text-xs font-medium text-[#0F172A] truncate">{project.currency || 'USD'}: {project.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {project.start_date && (
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                              <Calendar className="h-3 w-3 text-[#006AFF]" />
                            </div>
                            <span className="text-xs text-[#0F172A]/70">Start: {project.start_date}</span>
                          </div>
                        )}
                        {project.expected_end_date && (
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                              <Calendar className="h-3 w-3 text-[#006AFF]" />
                            </div>
                            <span className="text-xs text-[#0F172A]/70">End: {project.expected_end_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State - Compact Modern Design */
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2 tracking-tight">
                  {hasPermission('projects.read') ? "No Projects Yet" : "Access Restricted"}
                </h3>
                <p className="text-xs text-[#0F172A]/60 max-w-md mx-auto">
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