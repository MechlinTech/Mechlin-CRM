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
    <div className="min-h-screen">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto pt-6">
          
          <div className="space-y-6">
            {/* Organization Header - Compact Design */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">
                    {organization.name}
                  </h1>
                  <p className="text-xs text-[#0F172A]/60 mt-0.5">Organization overview and management</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`
                  ${
                    organization.status === 'active'
                      ? 'border-green-500/30 text-green-600 bg-green-50'
                      : organization.status === 'trial'
                      ? 'border-yellow-500/30 text-yellow-600 bg-yellow-50'
                      : 'border-red-500/30 text-red-600 bg-red-50'
                  }
                  font-medium px-3 py-1 rounded-full text-xs
                `}
              >
                {organization.status ? organization.status.charAt(0).toUpperCase() + organization.status.slice(1) : 'Unknown'}
              </Badge>
            </div>

            {/* Stats Grid - Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#006AFF]/10 rounded-lg">
                    <Building className="h-4 w-4 text-[#006AFF]" />
                  </div>
                  <span className="text-xs font-medium text-[#0F172A]/70">Total Projects</span>
                </div>
                <p className="text-2xl font-semibold text-[#0F172A] tracking-tight">{projects.length}</p>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-[#0F172A]/70">Active Projects</span>
                </div>
                <p className="text-2xl font-semibold text-green-600 tracking-tight">{activeProjects.length}</p>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-[#0F172A]/70">Pending Projects</span>
                </div>
                <p className="text-2xl font-semibold text-yellow-600 tracking-tight">{pendingProjects.length}</p>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[#006AFF]/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-[#006AFF]" />
                  </div>
                  <span className="text-xs font-medium text-[#0F172A]/70">Total Budget</span>
                </div>
                <p className="text-2xl font-semibold text-[#0F172A] tracking-tight">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Projects Section - Compact Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <FolderKanban className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">All Projects</h2>
                  <p className="text-xs text-[#0F172A]/60 mt-0.5">Manage and monitor all organization projects</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                {projects.length} Projects
              </Badge>
            </div>

            {/* Projects Grid - Compact Cards */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block"
                  >
                    <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#0F172A]/10 hover:border-[#006AFF]/20 transition-all duration-300 hover:shadow-lg">
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
                                : 'border-red-500/30 text-red-600 bg-red-50'
                            }`}
                          >
                            {project.status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {project.budget && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                                <DollarSign className="h-3 w-3 text-[#006AFF]" />
                              </div>
                              <span className="text-xs font-medium text-[#0F172A]">
                                {project.currency || '$'}{Number(project.budget).toLocaleString()}
                              </span>
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

                          {project.repo_link && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-[#006AFF]/10 rounded-lg">
                                <ExternalLink className="h-3 w-3 text-[#006AFF]" />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(project.repo_link, '_blank', 'noopener,noreferrer')
                                }}
                                className="text-xs text-[#006AFF] hover:text-[#006AFF]/80 transition-colors font-medium truncate text-left"
                              >
                                View Repository
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-3 border-t border-[#0F172A]/10 flex items-center justify-between text-xs text-[#0F172A]/50">
                          <span className="font-mono">{project.id.slice(0, 8)}</span>
                          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State - Compact Design */
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                  <FolderKanban className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2 tracking-tight">No Projects Yet</h3>
                <p className="text-xs text-[#0F172A]/60 max-w-md mx-auto">
                  Your organization doesn't have any projects yet. Projects will appear here once they are created.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
