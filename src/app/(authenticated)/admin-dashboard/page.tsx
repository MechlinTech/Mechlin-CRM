"use client"
 
import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminCached, isInternalUserCached } from '@/lib/permission-cache'
import { getUserWithOrganisation, getOrganisationProjects } from '@/actions/organisation-management'
import { Building2, Building, Users, Calendar, DollarSign, ExternalLink, Loader2, FolderKanban, BarChart3, TrendingUp, PieChart, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  OrgProjectStatusChart,
  OrgBudgetChart,
  OrgTimelineChart,
  OrgActivityChart
} from '@/components/custom/organization-analytics'
 
export default function AdminDashboardPage() {
  const [organization, setOrganization] = React.useState<any>(null)
  const [projects, setProjects] = React.useState<any[]>([])
  const [analytics, setAnalytics] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = React.useState(false)
 
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
          setError('Organisation not found')
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
 
        // Fetch organization analytics
        try {
          // First test if API routes are working
          console.log('Testing API connectivity...')
          const testResponse = await fetch('/api/test-analytics')
          console.log('Test API response:', testResponse.status)
         
          if (testResponse.ok) {
            const testData = await testResponse.json()
            console.log('Test API data:', testData)
          }
 
          // Now try the actual analytics endpoint
          console.log('Fetching analytics...')
          const analyticsResponse = await fetch('/api/organization-analytics', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important: include cookies for authentication
          })
 
          console.log('Analytics response status:', analyticsResponse.status)
         
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            console.log('Analytics data received:', analyticsData)
            setAnalytics(analyticsData)
          } else {
            const errorText = await analyticsResponse.text()
            console.error('Error fetching analytics - Status:', analyticsResponse.status, 'Error:', errorText)
            // Don't set error for analytics failure, just continue without it
          }
        } catch (fetchError) {
          console.error('Network error fetching analytics:', fetchError)
          // Don't set error for analytics failure, just continue without it
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
              <h3 className="font-medium mb-2">No Organisation Found</h3>
              <p className="text-muted-foreground">You are not associated with any organisation.</p>
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
                  <p className="text-xs text-[#0F172A]/60 mt-0.5">Organisation overview and management</p>
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
             
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Link href={`/admin-dashboard/about`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    Organisation Details
                  </Button>
                </Link>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-[#006AFF] text-white rounded-lg hover:bg-[#0056CC] transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                  {showAnalytics ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </div>
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
 
            {/* Analytics Section */}
            {showAnalytics && (
              <div className="space-y-6">
                {analytics ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Organisation Analytics</h2>
                          <p className="text-xs text-[#0F172A]/60 mt-0.5">Detailed insights and performance metrics</p>
                        </div>
                      </div>
                    </div>
 
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs font-medium">Total Users</p>
                        <p className="text-2xl font-bold">{analytics.organization.total_users}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                 
                  <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs font-medium">Avg Project Budget</p>
                        <p className="text-2xl font-bold">
                          ${Math.round(analytics.organization.average_project_budget).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                 
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs font-medium">Active Rate</p>
                        <p className="text-2xl font-bold">
                          {analytics.organization.total_projects > 0
                            ? Math.round((analytics.organization.active_projects / analytics.organization.total_projects) * 100)
                            : 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                 
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs font-medium">Total Budget</p>
                        <p className="text-2xl font-bold">
                          ${analytics.organization.total_budget.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-200" />
                    </div>
                  </div>
                </div>
 
                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Project Status Chart */}
                  <div className="bg-white rounded-xl border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <PieChart className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Project Status Distribution</h3>
                    </div>
                    <OrgProjectStatusChart projects={analytics.projects} />
                  </div>
 
                  {/* Budget Chart */}
                  <div className="bg-white rounded-xl border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Projects by Budget</h3>
                    </div>
                    <OrgBudgetChart projects={analytics.projects} />
                  </div>
 
                  {/* Timeline Chart */}
                  <div className="bg-white rounded-xl border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Project Growth Over Time</h3>
                    </div>
                    <OrgTimelineChart projects={analytics.projects} />
                  </div>
 
                  {/* Activity Chart */}
                  <div className="bg-white rounded-xl border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Project Activity This Year</h3>
                    </div>
                    <OrgActivityChart projects={analytics.projects} />
                  </div>
                </div>
              </>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2 tracking-tight">Loading Analytics</h3>
                    <p className="text-xs text-[#0F172A]/60 max-w-md mx-auto">
                      Analytics data is being prepared. This should only take a moment...
                    </p>
                  </div>
                )}
              </div>
            )}
 
            {/* Projects Section - Compact Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <FolderKanban className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">All Projects</h2>
                  <p className="text-xs text-[#0F172A]/60 mt-0.5">Manage and monitor all organisation projects</p>
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
                  Your organisation doesn't have any projects yet. Projects will appear here once they are created.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
 