"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminCached, isInternalUserCached } from '@/lib/permission-cache'
import { getUserWithOrganisation, getOrganisationProjects } from '@/actions/organisation-management'
import { Building2, Building, Users, Calendar, DollarSign, ExternalLink, Loader2, FolderKanban } from 'lucide-react'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Card className="max-w-md border-destructive/20">
            <CardContent className="p-6">
              <h3 className="text-destructive font-medium mb-2">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <h3 className="font-medium mb-2">No Organization Found</h3>
              <p className="text-muted-foreground">You are not associated with any organization.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'Active')
  const pendingProjects = projects.filter(p => p.status === 'Pending')
  const suspendedProjects = projects.filter(p => p.status === 'Suspended')
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)

  return (
    <div className="min-h-screen bg-background">
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
                className={`
                  ${
                    organization.status === 'active'
                      ? 'border-green-600/30 text-green-700 bg-green-50/50'
                      : organization.status === 'trial'
                      ? 'border-yellow-600/30 text-yellow-700 bg-yellow-50/50'
                      : 'border-destructive/30 text-destructive bg-destructive/5'
                  }
                `}
              >
                {organization.status ? organization.status.charAt(0).toUpperCase() + organization.status.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Projects</span>
                </div>
                <p className="text-2xl font-semibold">{projects.length}</p>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Active Projects</span>
                </div>
                <p className="text-2xl font-semibold text-green-700">{activeProjects.length}</p>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Pending Projects</span>
                </div>
                <p className="text-2xl font-semibold text-yellow-700">{pendingProjects.length}</p>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Budget</span>
                </div>
                <p className="text-2xl font-semibold">
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
              <div className="p-2 rounded-lg">
                <FolderKanban className="h-5 w-5 text-[#006AFF]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
                <p className="text-gray-600">Manage and monitor all organization projects</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
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
                  <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs ${
                            project.status === 'Active'
                              ? 'border-green-600/30 text-green-700 bg-green-50/50'
                              : project.status === 'Pending'
                              ? 'border-yellow-600/30 text-yellow-700 bg-yellow-50/50'
                              : 'border-destructive/30 text-destructive bg-destructive/5'
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
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {project.currency || '$'}{Number(project.budget).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {project.start_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>Start: {project.start_date}</span>
                          </div>
                        )}
                        
                        {project.expected_end_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>End: {project.expected_end_date}</span>
                          </div>
                        )}

                        {project.repo_link && (
                          <div className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(project.repo_link, '_blank', 'noopener,noreferrer')
                              }}
                              className="text-primary hover:underline truncate text-left font-medium"
                            >
                              Repository
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
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
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-blue-600" />
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
