"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { getAllUsersAction } from "@/actions/user-management"
import { UserPermissionsTable } from "@/components/custom/user-permissions/user-permissions-table"
import { Building, Users, User, Settings, BarChart3, Building2, TrendingUp, PieChart, BarChart3 as BarChartIcon, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRBAC } from "@/context/rbac-context"
import { redirect } from 'next/navigation'
import { isAdmin,isSuperAdmin } from '@/lib/permissions'
import {
  UserDistributionChart,
  OrganisationStatusChart,
  ProjectBudgetChart,
  ProjectStatusChart,
  OrganisationGrowthChart
} from '@/components/custom/dashboard-charts'
type CheckRoleResponse = {
  hasRole: boolean
  roleNames?: string[]
  error?: string
}
 // RBAC Integration

export default  function DashboardPage() {
  
  const [projects, setProjects] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [mechlinUsers, setMechlinUsers] = React.useState<any[]>([])
  const [otherUsers, setOtherUsers] = React.useState<any[]>([])
  const [organisations, setOrganisations] = React.useState<any[]>([])
  const [activeTab, setActiveTab] = React.useState<'projects' | 'users' | 'organisations' | 'etc'>('organisations')
  const [isLoading, setIsLoading] = React.useState(true)

  // RBAC Hook
  const { hasPermission, loading } = useRBAC();


  if (!isAdmin() && !isSuperAdmin()) {
  redirect('/unauthorized')
}

    
    // Check if user has permission to read user information
  
  async function fetchProjects() {
    const roles=await getMyRoleNames();
   if(!roles.includes('admin') && !roles.includes('super_admin')){
    redirect('/unauthorized')
   }
    const { data, error } = await supabase
      .from('projects')
      .select('*, organisations(*)')
      .order('created_at', { ascending: false })
   
    if (data) {
      setProjects(data)
    }
    if (error) {
      console.error('Error fetching projects:', error)
    }
  }
      async function getMyRoleNames(): Promise<string[]> {
    try {
      const res = await fetch("/api/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send empty role to get roleNames back, OR send a dummy role and read roleNames
        body: JSON.stringify({ role: "__list__" }),
        cache: "no-store",
      })

      const data: CheckRoleResponse = await res.json().catch(() => ({ hasRole: false }))

      // If API failed, return empty
      if (!res.ok) {
        console.error("[check-role] failed", data)
        return []
      }

      return Array.isArray(data.roleNames) ? data.roleNames : []
    } catch (e) {
      console.error("[check-role] error", e)
      return []
    }
  }
  

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*, organisations(name)')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
      const mechlin = data.filter(user => 
        user.organisations?.name?.toLowerCase().includes('mechlin') ||
        user.email?.includes('@mechlin') || 
        user.name?.toLowerCase().includes('mechlin')
      )
      const others = data.filter(user => 
        !user.organisations?.name?.toLowerCase().includes('mechlin') &&
        !user.email?.includes('@mechlin') && 
        !user.name?.toLowerCase().includes('mechlin')
      )
      setMechlinUsers(mechlin)
      setOtherUsers(others)
    }
    if (error) {
      console.error('Error fetching users:', error)
    }
  }

  async function fetchOrganisations() {
    // Use a single optimized query with left joins to include all organisations
    const { data: organisations, error: orgError } = await supabase
      .from('organisations')
      .select(`
        *,
        projects (
          id
        ),
        users (
          id
        )
      `)
      .order('created_at', { ascending: false })
    
    if (orgError) {
      console.error('Error fetching organisations:', orgError)
      return
    }
    
    if (organisations) {
      // Transform the data to extract counts from the joined data
      const organisationsWithCounts = organisations.map(org => ({
        ...org,
        project_count: org.projects?.length || 0,
        user_count: org.users?.length || 0
      }))
      
      setOrganisations(organisationsWithCounts)
    }
  }

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      await Promise.all([
        fetchProjects(),
        fetchUsers(),
        fetchOrganisations()
      ])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // RBAC: Filter tabs based on user permissions
  const tabs = [
    { id: 'organisations' as const, label: 'Organisations', icon: Building2, count: organisations.length, permission: 'organisations.read' },
    { id: 'projects' as const, label: 'Projects', icon: Building, count: projects.length, permission: 'projects.read' },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length, permission: 'users.read' },
    { id: 'etc' as const, label: 'More', icon: Settings, count: null, permission: null }
  ].filter(tab => !tab.permission || hasPermission(tab.permission));

  // Handle initial tab selection if 'organisations' is not allowed
  React.useEffect(() => {
    if (!loading && tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [loading, tabs, activeTab]);

  if (loading) return null;

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="custom-container">
          {/* Tab Navigation */}
          <div className="flex justify-end mb-6 sm:mb-8">
            <div className="grid grid-cols-2 sm:flex items-center p-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-sm sm:items-center">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium  transition-all duration-200 sm:justify-start ${
                      activeTab === tab.id
                        ? 'bg-[#006AFF] text-white shadow-lg shadow-gray-900/25 scale-[1.02]'
                        : 'hover:text-[#006AFF] hover:bg-gray-100/50'
                    }`}
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${activeTab === tab.id ? 'text-white' : 'text-[#0F172A] group-hover:text-[#006AFF]'}`} />
                    <span className="font-medium text-sm">{tab.label}</span>
                    {tab.count !== null && (
                      <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className={`text-xs font-semibold ${activeTab === tab.id ? 'bg-white/20 text-white border-white/30' : ' text-gray-600 border-gray-200'}`}>
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="w-full">
            {/* Projects Tab */}
            {activeTab === 'projects' && hasPermission('projects.read') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#006AFF] rounded shadow-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold ">All Projects</h2>
                      <p className="text-sm text-[#4C5C96]/70">Manage your active projects</p>
                    </div>
                    <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">{projects.length}</Badge>
                  </div>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <Link 
                        key={project.id} 
                        href={`/projects/${project.id}`}
                        className="group block p-6 bg-white backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#006AFF] transition-all duration-300 force-white-bg"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-lg tracking-tight  group-hover:text-[#006AFF] ">
                              {project.name}
                            </h3>
                            <Badge
                                variant="outline"
                                className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                  project.status === 'Active'
                                    ? 'border-green-500/30 text-green-600 '
                                    : project.status === 'Pending'
                                    ? 'border-yellow-500/30 text-yellow-600 '
                                    : project.status === 'Suspended'
                                    ? 'border-red-500/30 text-red-600 '
                                    : 'border-gray-300 text-gray-600 '
                                }`}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4 text-[#006AFF]" />
                              <span className=" truncate">
                                {project.organisations?.name || 'No Organization'}
                              </span>
                            </div>
                            {project.budget && (
                              <div className="flex items-center gap-1 ">
                                <p className="text-xs ">{project.currency || '$'}{project.budget.toLocaleString()}</p>
                              </div>
                            )}
                            {project.start_date && (
                              <div className="flex items-center gap-1 ">
                                <span className="text-xs ">Start: {project.start_date}</span>
                              </div>
                            )}
                            {project.expected_end_date && (
                              <div className="flex items-center gap-1 ">
                                <span className="text-xs ">End: {project.expected_end_date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#006AFF] to-[#006AFF] rounded-md flex items-center justify-center shadow-lg mb-6">
                      <Building className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-bsemibold tracking-tight mb-3">No Projects Yet</h3>
                    <p className="text-xs max-w-md mx-auto">Create your first project to start collaborating with your team and tracking progress</p>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && hasPermission('users.read') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#006AFF] rounded shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold ">All Users</h2>
                      <p className="text-sm text-[#4C5C96]/60">Team members and collaborators</p>
                    </div>
                    <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">{users.length}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-lg">Mechlin Team</h3>
                        <p className="text-sm text-[#0F172A]/60">Internal team members</p>
                      </div>
                      <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold ml-auto">{mechlinUsers.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {mechlinUsers.length > 0 ? (
                        mechlinUsers.map((user) => (
                          <div key={user.id} className="p-4 border border-[#0F172A]/20 rounded-xl flex items-center gap-4 transition-all duration-300">
                            <div className="h-10 w-10 bg-[#006AFF] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="font-medium text-sm">No Mechlin team members</p>
                          <p className="text-xs">Internal team will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-lg">Other Users</h3>
                        <p className="text-sm text-gray-500">Client Collaborators</p>
                      </div>
                      <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold ml-auto">{otherUsers.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {otherUsers.length > 0 ? (
                        otherUsers.map((user) => (
                          <div key={user.id} className="p-4  border border-[#0F172A]/20 rounded-xl flex items-center gap-4 transition-all duration-300">
                            <div className="h-10 w-10  rounded-full flex items-center justify-center  font-bold shadow-lg">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="font-medium text-sm">No other users</p>
                          <p className="text-xs">External collaborators will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organisations Tab */}
            {activeTab === 'organisations' && hasPermission('organisations.read') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#006AFF] rounded shadow-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">All Organisations</h2>
                      <p className="text-sm text-[#4C5C96]/60">Manage your organization portfolio</p>
                    </div>
                    <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">{organisations.length}</Badge>
                  </div>
                </div>
                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading organization details...</p>
                  </div>
                ) : organisations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organisations.map((org) => (
                      <Link 
                        key={org.id} 
                        href={`/organisations/${org.id}`}
                        className="group block p-6 bg-white backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#006AFF] transition-all duration-300 force-white-bg"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">                           
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className=" font-medium cursor-pointer text-lg tracking-tight hover:text-[#006AFF] transition-colors line-clamp-2 leading-tight">
                                  {org.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-semibold px-2 rounded-md border-2 flex-shrink-0 ${
                                    org.status === 'active'
                                      ? 'border-green-500/30 text-green-700 bg-green-50'
                                      : org.status === 'trial'
                                      ? 'border-yellow-500/30 text-yellow-700 bg-yellow-50'
                                      : org.status === 'suspended'
                                      ? 'border-red-500/30 text-red-700 bg-red-50'
                                      : 'border-gray-200 text-gray-700 bg-gray-50'
                                  }`}
                                >
                                  {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'Unknown'}
                                </Badge>
                              </div>
                              {org.user_count !== undefined && (
                                <div className="flex justify-end mt-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mr-2">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium">{org.user_count}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm border-t border-gray-100 pt-4">
                            <div className="flex items-center">
                              <span className="">Projects: {org.project_count || 0}</span>
                            </div>
                            {org.is_internal !== undefined && (
                              <div className="flex items-center ">
                                <span className="">
                                  {org.is_internal ? 'Internal Organization' : 'External Organization'}
                                </span>
                              </div>
                            )}
                            {org.created_at && (
                              <div className="flex items-center">
                                <span className="">Created {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="mx-auto w-20 h-20 bg-[#006AFF] rounded-md flex items-center justify-center shadow-lg mb-6">
                      <Building2 className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg tracking-tight mb-3">No Organizations Yet</h3>
                    <p className="text-xs text-gray-800 max-w-md mx-auto">Create your first organization to start managing projects and teams efficiently</p>
                  </div>
                )}
              </div>
            )}

            {/* More Tab */}
            {activeTab === 'etc' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#006AFF] rounded-md shadow-lg">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg">Analytics Dashboard</h2>
                      <p className="text-sm text-[#4C5C96]/60">Insights and analytics from your data</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Distribution Chart */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-4">
                      <PieChart className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">User Distribution</h3>
                    </div>
                    <UserDistributionChart mechlinUsers={mechlinUsers.length} otherUsers={otherUsers.length} />
                  </div>

                  {/* Organisation Status Chart */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChartIcon className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Organisations by Status</h3>
                    </div>
                    <OrganisationStatusChart organisations={organisations} />
                  </div>

                  {/* Project Budget Chart */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Top Projects by Budget</h3>
                    </div>
                    <ProjectBudgetChart projects={projects} />
                  </div>

                  {/* Project Status Chart */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 className="h-5 w-5 text-[#006AFF]" />
                      <h3 className="text-lg font-semibold">Projects by Status</h3>
                    </div>
                    <ProjectStatusChart projects={projects} />
                  </div>
                </div>

                {/* Organisation Growth Chart - Full Width */}
                <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm force-white-bg">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-5 w-5 text-[#006AFF]" />
                    <h3 className="text-lg font-semibold">Organisation Growth Over Time</h3>
                  </div>
                  <OrganisationGrowthChart organisations={organisations} />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-md p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-md p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Projects</p>
                        <p className="text-2xl font-bold">{projects.length}</p>
                      </div>
                      <Building className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-md p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Orgs</p>
                        <p className="text-2xl font-bold">{organisations.length}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-md p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Active Projects</p>
                        <p className="text-2xl font-bold">{projects.filter(p => p.status === 'Active').length}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}