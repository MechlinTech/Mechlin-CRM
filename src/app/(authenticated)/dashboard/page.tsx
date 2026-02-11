"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Building, Users, User, Settings, BarChart3, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [mechlinUsers, setMechlinUsers] = React.useState<any[]>([])
  const [otherUsers, setOtherUsers] = React.useState<any[]>([])
  const [organisations, setOrganisations] = React.useState<any[]>([])
  const [activeTab, setActiveTab] = React.useState<'projects' | 'users' | 'organisations' | 'etc'>('organisations')

  

  async function fetchProjects() {
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

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*, organisations(name)')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
      // Separate Mechlin users from others based on organization name
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
    // First fetch all organisations
    const { data: organisations, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgError) {
      return
    }

    if (organisations) {
      // Then fetch user counts for each organisation
      const organisationsWithCounts = await Promise.all(
        organisations.map(async (org) => {
          const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id)

          return {
            ...org,
            user_count: countError ? 0 : count || 0
          }
        })
      )
      
      setOrganisations(organisationsWithCounts)
    }
  }

  // Function to refresh users after creating a new one
  const handleUserCreated = () => {
    fetchUsers()
  }

  // Function to refresh organisations after creating a new one
  const handleOrganizationCreated = () => {
    fetchOrganisations()
  }

  
 React.useEffect(() => {
    fetchProjects()
    fetchUsers()
    fetchOrganisations()
  }, [])

  const tabs = [
    { id: 'organisations' as const, label: 'Organisations', icon: Building2, count: organisations.length },
    { id: 'projects' as const, label: 'Projects', icon: Building, count: projects.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'etc' as const, label: 'More', icon: Settings, count: null }
  ]

  return (   <div className="min-h-screen ">
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
                    className={`group relative flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-xs transition-all duration-200 sm:justify-start ${
                      activeTab === tab.id
                        ? 'bg-[#4C5C96] text-white shadow-lg shadow-gray-900/25 scale-[1.02]'
                        : 'text-gray-600 hover:text-[#4F46E5] hover:bg-gray-100/50'
                    }`}
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${activeTab === tab.id ? 'text-white' : 'text-[#0F172A] group-hover:text-[#4F46E5]'}`} />
                    <span className="font-medium text-xs">{tab.label}</span>
                    {tab.count !== null && (
                      <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className={`text-xs font-semibold ${activeTab === tab.id ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
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
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4C5C96] rounded shadow-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#0F172A]">All Projects</h2>
                      <p className="text-sm text-[#4C5C96]/60">Manage your active projects</p>
                    </div>
                    <Badge variant="outline" className="bg-[#4C5C96]/10 text-[#4C5C96] border-[#4C5C96]/20 font-semibold">{projects.length}</Badge>
                  </div>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map((project) => (
                      <Link 
                        key={project.id} 
                        href={`/projects/${project.id}`}
                        className="group block p-6 bg-white/80 backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#4F46E5] transition-all duration-300"
                      >
                        <div className="space-y-4">
                          {/* Project Header */}
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] group-hover:text-[#4F46E5] ">
                              {project.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                project.status === 'Active' 
                                  ? 'border-[#0F172A]/20 text-[#0F172A] bg-[#0F172A]/10' 
                                  : project.status === 'Pending'
                                  ? 'border-[#0F172A]/20 text-[#0F172A] bg-[#0F172A]/10'
                                  : 'border-[#0F172A]/20 text-[#0F172A] bg-[#0F172A]/10'
                              }`}
                            >
                              {project.status}
                            </Badge>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="font-medium truncate">
                                {project.organisations?.name || 'No Organization'}
                              </span>
                            </div>
                            
                            {project.budget && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <p className="text-xs font-medium">{project.currency || '$'}{project.budget.toLocaleString()}</p>
                              </div>
                            )}

                            {project.start_date && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="text-xs font-medium">Start: {project.start_date}</span>
                              </div>
                            )}

                            {project.expected_end_date && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="text-xs font-medium">End: {project.expected_end_date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-lg mb-6">
                      <Building className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900 ">No Projects Yet</h3>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">Create your first project to start collaborating with your team and tracking progress</p>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4C5C96] rounded shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#0F172A]">All Users</h2>
                      <p className="text-sm text-[#4C5C96]/60">Team members and collaborators</p>
                    </div>
                    <Badge variant="outline" className="bg-[#4C5C96]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold">{users.length}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Mechlin Users */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      
                      <div>
                        <h3 className="font-semibold text-[#0F172A] text-lg">Mechlin Team</h3>
                        <p className="text-sm text-[#0F172A]/60">Internal team members</p>
                      </div>
                      <Badge variant="outline" className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold ml-auto">{mechlinUsers.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {mechlinUsers.length > 0 ? (
                        mechlinUsers.map((user) => (
                          <div key={user.id} className="p-4 bg-[#0F172A]/5 border border-[#0F172A]/20 rounded-xl flex items-center gap-4 transition-all duration-300">
                            <div className="h-10 w-10 bg-[#4C5C96] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
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

                  {/* Other Users */}
                  <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      
                      <div>
                        <h3 className="font-semibold text-gray-700 text-lg">Other Users</h3>
                        <p className="text-sm text-gray-500">Client Collaborators</p>
                      </div>
                      <Badge variant="outline" className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold ml-auto">{otherUsers.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {otherUsers.length > 0 ? (
                        otherUsers.map((user) => (
                          <div key={user.id} className="p-4 bg-[#0F172A]/5 border border-[#0F172A]/20 rounded-xl flex items-center gap-4 transition-all duration-300">
                            <div className="h-10 w-10 bg-[#3A4675] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
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
            {activeTab === 'organisations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4C5C96] rounded shadow-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#0F172A]">All Organisations</h2>
                      <p className="text-sm text-[#4C5C96]/60">Manage your organization portfolio</p>
                    </div>
                    <Badge variant="outline" className="bg-[#4C5C96]/10 text-[#4C5C96] border-[#4C5C96]/20 font-semibold">{organisations.length}</Badge>
                  </div>
                </div>
                {organisations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organisations.map((org) => (
                      <Link 
                        key={org.id} 
                        href={`/organisations/${org.id}`}
                        className="group block p-6 bg-white/80 backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#4F46E5] transition-all duration-300"
                      >
                        <div className="space-y-4">
                          {/* Organization Header */}
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-[#4C5C96] rounded flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300">
                              {org.name?.charAt(0)?.toUpperCase() || 'O'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="cursor-pointer text-lg font-semibold tracking-tight text-gray-900 hover:text-[#4F46E5] transition-colors line-clamp-2 leading-tight">
                                {org.name}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs font-semibold px-2 rounded-md border-2 ${
                                    org.status === 'active' 
                                      ? 'border-[#0F172A]/20 text-[#0F172A] bg-[#0F172A]/10' 
                                      : org.status === 'suspended'
                                      ? 'border-red-200 text-red-700 bg-red-50'
                                      : org.status === 'trial'
                                      ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                      : 'border-gray-200 text-gray-700 bg-gray-50'
                                  }`}
                                >
                                  {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'Unknown'}
                                </Badge>
                                {org.user_count !== undefined && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium text-xs">{org.user_count}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Organization Details */}
                          <div className="space-y-3 text-xs font-medium border-t border-gray-100 pt-4">
                            {org.slug && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="">{org.slug}</span>
                              </div>
                            )}
                            
                            {org.is_internal !== undefined && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="">
                                  {org.is_internal ? 'Internal Organization' : 'External Organization'}
                                </span>
                              </div>
                            )}

                            {org.created_at && (
                              <div className="flex items-center gap-1 text-gray-600">
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
                    <div className="mx-auto w-20 h-20 bg-[#4C5C96] rounded-md flex items-center justify-center shadow-lg mb-6">
                      <Building2 className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900">No Organizations Yet</h3>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">Create your first organization to start managing projects and teams efficiently</p>
                  </div>
                )}
              </div>
            )}

            {/* More Tab */}
            {activeTab === 'etc' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md shadow-lg">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">More Features</h2>
                      <p className="text-sm text-gray-500">Additional tools and settings</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 bg-white rounded-md border border-gray-200/50 text-center hover:shadow-lg transition-shadow">
                    <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2 text-lg text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-600">View detailed analytics and reports</p>
                  </div>
                  <div className="p-6 bg-white rounded-md border border-gray-200/50 text-center hover:shadow-lg transition-shadow">
                    <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2 text-lg text-gray-900">Settings</h4>
                    <p className="text-sm text-gray-600">Configure system settings and preferences</p>
                  </div>
                  <div className="p-6 bg-white rounded-md border border-gray-200/50 text-center hover:shadow-lg transition-shadow">
                    <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h4 className="font-bold mb-2 text-lg text-gray-900">Teams</h4>
                    <p className="text-sm text-gray-600">Manage teams and permissions</p>
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