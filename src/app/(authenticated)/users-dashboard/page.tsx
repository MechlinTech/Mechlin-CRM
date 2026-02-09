"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Building, Users, Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

export default function ClientDashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (user) {
      fetchUserProjects()
    }
  }, [user])

  async function fetchUserProjects() {
    setLoading(true)
    try {
      // Fetch projects where the current user is assigned via project_members
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching user projects:', error)
        return
      }

      // Extract project data from the nested structure
      const projectData = data?.map(item => item.projects) || []
      setProjects(projectData)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading your projects...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50">
      <div className="px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600">Projects assigned to you</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
              {projects.length}
            </Badge>
          </div>

          {/* Projects Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link 
                  key={project.id} 
                  href={`/projects/${project.id}`}
                  className="group block p-6 bg-white rounded-2xl border border-gray-200/50 hover:border-blue-300 transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Project Header */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-semibold tracking-tight text-gray-900 group-hover:text-blue-600 line-clamp-2">
                        {project.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          project.status === 'Active' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : project.status === 'Pending'
                            ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                            : 'border-gray-200 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {project.status}
                      </Badge>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium truncate">
                          {project.organisations?.name || 'No Organization'}
                        </span>
                      </div>
                      
                      {project.budget && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{project.currency || '$'}{project.budget.toLocaleString()}</span>
                        </div>
                      )}

                      {project.start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs uppercase tracking-wider">Start: {project.start_date}</span>
                        </div>
                      )}

                      {project.expected_end_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs uppercase tracking-wider">End: {project.expected_end_date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <Building className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3 text-gray-900">No Projects Assigned</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't been assigned to any projects yet. Contact your administrator to get access to projects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
