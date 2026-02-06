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

  React.useEffect(() => {
    fetchProjects()
    fetchUsers()
    fetchOrganisations()
  }, [])

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

  const tabs = [
    { id: 'organisations' as const, label: 'Organisations', icon: Building2, count: organisations.length },
    { id: 'projects' as const, label: 'Projects', icon: Building, count: projects.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'etc' as const, label: 'More', icon: Settings, count: null }
  ]

  return (
    <div className="px-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="custom-container">
        {/* Tab Navigation */}
        <div className="flex justify-end mb-6">
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-lg sm:flex sm:items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all sm:px-4 sm:justify-start ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <Badge variant="outline" className="text-xs ml-1">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-zinc-600" />
                  <h2 className="text-lg font-bold">All Projects</h2>
                  <Badge variant="outline" className="text-xs">{projects.length}</Badge>
                </div>
              </div>
              
              {projects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {projects.map((project) => (
                    <Link 
                      key={project.id} 
                      href={`/projects/${project.id}`}
                      className="group block p-4 bg-white border border-zinc-200 rounded-xl hover:border-black hover:shadow-lg transition-all"
                    >
                      <div className="space-y-3">
                        {/* Project Header */}
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-bold tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {project.name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold ${
                              project.status === 'Active' 
                                ? 'border-green-200 text-green-700 bg-green-50' 
                                : project.status === 'Pending'
                                ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                : 'border-zinc-200 text-zinc-700 bg-zinc-50'
                            }`}
                          >
                            {project.status}
                          </Badge>
                        </div>

                        {/* Project Details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-zinc-400" />
                            <span className="text-zinc-600 font-medium truncate">
                              {project.organisations?.name || 'No Organization'}
                            </span>
                          </div>
                          
                          {project.budget && (
                            <div className="text-zinc-600">
                              <span className="font-bold">{project.currency || '$'}{project.budget.toLocaleString()}</span>
                            </div>
                          )}

                          {project.start_date && (
                            <div className="text-zinc-600">
                              <span className="text-xs uppercase tracking-wider">Start:</span> {project.start_date}
                            </div>
                          )}

                          {project.expected_end_date && (
                            <div className="text-zinc-600">
                              <span className="text-xs uppercase tracking-wider">End:</span> {project.expected_end_date}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold tracking-tight mb-2">No Projects Yet</h3>
                  <p className="text-zinc-500">Create your first project to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-zinc-600" />
                  <h2 className="text-lg font-bold">All Users</h2>
                  <Badge variant="outline" className="text-xs">{users.length}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mechlin Users */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <h3 className="font-bold text-blue-600">Mechlin Team</h3>
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">{mechlinUsers.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {mechlinUsers.length > 0 ? (
                      mechlinUsers.map((user) => (
                        <div key={user.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-zinc-600">{user.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 text-sm">
                        No Mechlin team members
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Users */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-zinc-600" />
                    <h3 className="font-bold">Other Users</h3>
                    <Badge variant="outline" className="text-xs">{otherUsers.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {otherUsers.length > 0 ? (
                      otherUsers.map((user) => (
                        <div key={user.id} className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center gap-3">
                          <div className="h-8 w-8 bg-zinc-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-zinc-600">{user.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 text-sm">
                        No other users
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-zinc-600" />
                  <h2 className="text-lg font-bold">All Organisations</h2>
                  <Badge variant="outline" className="text-xs">{organisations.length}</Badge>
                </div>
              </div>
              {organisations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organisations.map((org) => (
                    <Link 
                      key={org.id} 
                      href={`/organisations/${org.id}`}
                      className="group block p-5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="space-y-2">
                        {/* Organization Header */}
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                            {org.name?.charAt(0)?.toUpperCase() || 'O'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                              {org.name}
                            </h3>
                            <div className="flex justify-start mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  org.status === 'active' 
                                    ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' 
                                    : org.status === 'suspended'
                                    ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                                    : org.status === 'trial'
                                    ? 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                                    : 'border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100'
                                } transition-colors`}
                              >
                                {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Organization Details */}
                        <div className="space-y-2 text-sm border-t border-zinc-100 pt-2">
                          {org.slug && (
                            <div className="flex items-center gap-2 text-zinc-600">
                              <span className="text-zinc-400">🔗</span>
                              <span className="font-medium truncate">{org.slug}</span>
                            </div>
                          )}
                          
                          {org.user_count !== undefined && (
                            <div className="flex items-center gap-2 text-zinc-600">
                              <span className="text-zinc-400">👥</span>
                              <span className="font-medium">{org.user_count} {org.user_count === 1 ? 'User' : 'Users'}</span>
                            </div>
                          )}
                          
                          {org.status && (
                            <div className="flex items-center gap-2 text-zinc-600">
                              <span className="text-zinc-400">📊</span>
                              <span className="font-medium capitalize">{org.status}</span>
                            </div>
                          )}

                          {org.is_internal !== undefined && (
                            <div className="flex items-center gap-2 text-zinc-600">
                              <span className="text-zinc-400">🏢</span>
                              <span className="font-medium">{org.is_internal ? 'Internal' : 'External'}</span>
                            </div>
                          )}

                          {org.created_at && (
                            <div className="text-zinc-500 text-xs pt-2 border-t border-zinc-50">
                              <span className="uppercase tracking-wide font-medium">Created {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold tracking-tight mb-2">No Organisations Yet</h3>
                  <p className="text-zinc-500">Create your first organisation to get started</p>
                </div>
              )}
            </div>
          )}

          {/* ETC Tab */}
          {activeTab === 'etc' && (
            <div className="space-y-6">
              <div>
                <h2>Analytics and Graphs</h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}