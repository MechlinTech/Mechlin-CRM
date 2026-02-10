"use client"

import React from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { Building, ArrowLeft, Users, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function OrganisationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [organisation, setOrganisation] = React.useState<any>(null)
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  React.useEffect(() => {
    if (params.id) {
      fetchOrganisationDetails()
      fetchOrganisationProjects()
    }
  }, [params.id])

  async function fetchOrganisationDetails() {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setOrganisation(data)
    }
    if (error) {
      console.error('Error fetching organisation:', error)
    }
  }

  async function fetchOrganisationProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organisation_id', params.id)
      .order('created_at', { ascending: false })

    if (data) {
      setProjects(data)
    }
    if (error) {
      console.error('Error fetching projects:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F172A] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading organization details...</p>
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-sm text-gray-600 mb-4">The organization you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="bg-white rounded-2xl  mb-8">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-lg font-bold text-[#0F172A]">{organisation.name}</h1>
                  <Badge 
                    variant="outline" 
                    className={`text-sm font-semibold px-3  ${
                      organisation.status === 'active' 
                        ? 'border-[#0F172A]/20 text-[#0F172A] bg-[#0F172A]/10' 
                        : organisation.status === 'suspended'
                        ? 'border-red-200 text-red-700 bg-red-50'
                        : organisation.status === 'trial'
                        ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                        : 'border-gray-200 text-gray-700 bg-gray-50'
                    }`}
                  >
                    {organisation.status ? organisation.status.charAt(0).toUpperCase() + organisation.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>

              
                <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-[#4F46E5] hover:text-[#4F46E5] p-0">
                      {detailsOpen ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show More
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4 p-4 bg-gray-50 rounded-lg">
                      {organisation.slug && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">@</span>
                          </div>
                          <span className="font-medium">{organisation.slug}</span>
                        </div>
                      )}
                      
                      {organisation.is_internal !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            organisation.is_internal 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-r from-gray-500 to-zinc-500'
                          }`}>
                            <span className="text-white text-xs font-bold">
                              {organisation.is_internal ? '🏢' : '🌐'}
                            </span>
                          </div>
                          <span className="font-medium">
                            {organisation.is_internal ? 'Internal Organization' : 'External Organization'}
                          </span>
                        </div>
                      )}

                      {organisation.created_at && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">📅</span>
                          </div>
                          <span className="font-medium">
                            Created {new Date(organisation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

         
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0F172A] rounded-xl shadow-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Projects</h2>
                  <p className="text-sm text-[#0F172A]/60">All projects for {organisation.name}</p>
                </div>
                <Badge variant="outline" className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold">
                  {projects.length}
                </Badge>
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
                      
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A] group-hover:text-[#4F46E5] line-clamp-2">
                          {project.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-semibold px-2 py-1 rounded-md flex-shrink-0 ${
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

                      
                      <div className="space-y-3 text-xs">
                        {project.budget && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">$</span>
                            </div>
                            <p className="text-xs text-gray-900">{project.currency || '$'}{project.budget.toLocaleString()}</p>
                          </div>
                        )}

                        {project.start_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">▶</span>
                            </div>
                            <span className="text-xs uppercase tracking-wider">Start: {project.start_date}</span>
                          </div>
                        )}

                        {project.expected_end_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">◉</span>
                            </div>
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
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-lg mb-6">
                  <Building className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900">No Projects Yet</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  This organization doesn't have any projects yet. Create the first project to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
