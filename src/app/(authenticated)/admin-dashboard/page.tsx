"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminCached, isInternalUserCached } from '@/lib/permission-cache'
import { getUserWithOrganisation, getOrganisationProjects } from '@/actions/organisation-management'
import { Building2, Building, Users, Calendar, DollarSign, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboardPage() {
  const [organization, setOrganization] = React.useState<any>(null)
  const [projects, setProjects] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function checkAccessAndFetchData() {
      try {
        // Get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          redirect('/login')
          return
        }

        // Run all checks in parallel for better performance
        const [adminCheck, internalCheck, userData] = await Promise.all([
          isAdminCached(),
          isInternalUserCached(),
          getUserWithOrganisation(user.id)
        ])
        
        if (!adminCheck || internalCheck) {
          redirect('/unauthorized')
          return
        }

        if (!userData?.organisations) {
          setError('Organization not found')
          setIsLoading(false)
          return
        }

        setOrganization(userData.organisations)

        // Fetch projects separately to avoid blocking
        const projectsData = await getOrganisationProjects(userData.organisation_id)
        
        if (!projectsData) {
          console.error('Error fetching projects')
          setError('Failed to fetch projects')
        } else {
          setProjects(projectsData)
        }

      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccessAndFetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <h3 className="text-yellow-800 font-semibold mb-2">No Organization Found</h3>
            <p className="text-yellow-600">You are not associated with any organization.</p>
          </div>
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'Active')
  const pendingProjects = projects.filter(p => p.status === 'Pending')
  const suspendedProjects = projects.filter(p => p.status === 'Suspended')
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Organization Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {organization.name}
                </CardTitle>
                <CardDescription>
                  Organization overview and management
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={`${
                  organization.status === 'active'
                    ? 'border-green-500/30 text-green-700 bg-green-50'
                    : organization.status === 'trial'
                    ? 'border-yellow-500/30 text-yellow-700 bg-yellow-50'
                    : 'border-red-500/30 text-red-700 bg-red-50'
                }`}
              >
                {organization.status ? organization.status.charAt(0).toUpperCase() + organization.status.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Projects</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{projects.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Active Projects</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{activeProjects.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-700 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Pending Projects</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{pendingProjects.length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Budget</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
            </div>
            
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
                <p className="text-gray-600">Manage and monitor all organization projects</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {projects.length} Projects
            </Badge>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-blue-300 border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs ${
                            project.status === 'Active'
                              ? 'border-green-500/30 text-green-600 bg-green-50'
                              : project.status === 'Pending'
                              ? 'border-yellow-500/30 text-yellow-600 bg-yellow-50'
                              : 'border-red-500/30 text-red-600 bg-red-50'
                          }`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {project.budget && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {project.currency || '$'}{Number(project.budget).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {project.start_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Start: {project.start_date}</span>
                          </div>
                        )}
                        
                        {project.expected_end_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>End: {project.expected_end_date}</span>
                          </div>
                        )}

                        {project.repo_link && (
                          <div className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(project.repo_link, '_blank', 'noopener,noreferrer')
                              }}
                              className="text-blue-600 hover:underline truncate text-left"
                            >
                              Repository
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {project.id.slice(0, 8)}...</span>
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your organization doesn't have any projects yet. Projects will appear here once they are created.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
