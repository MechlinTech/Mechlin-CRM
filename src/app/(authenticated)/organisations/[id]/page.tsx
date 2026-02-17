"use client"

import React from 'react'
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
import { getOrganisationById, getOrganisationProjects } from '@/actions/organisation-management'
import { useRBAC } from "@/context/rbac-context" // RBAC Integration

export default function OrganisationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [organisation, setOrganisation] = React.useState<any>(null)
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  // RBAC Hook
  const { hasPermission, loading: rbacLoading } = useRBAC();

  async function fetchOrganisationDetails() {
    const data = await getOrganisationById(params.id as string)
    if (data) {
      setOrganisation(data)
    }
  }

  async function fetchOrganisationProjects() {
    const data = await getOrganisationProjects(params.id as string)
    setProjects(data)
    setLoading(false)
  }
  
  React.useEffect(() => {
    if (params.id) {
      fetchOrganisationDetails()
      fetchOrganisationProjects()
    }
  }, [params.id])

  if (loading || rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading organization details...</p>
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg mb-2">Organization Not Found</h2>
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
          
          <div className=" rounded-2xl  mb-8">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold">{organisation.name}</h1>
                  <Badge
                      variant="outline"
                      className={`text-xs font-semibold px-2 rounded-md border-2 ${
                        organisation.status === 'active'
                          ? 'border-green-500/30 text-green-700 bg-green-50'
                          : organisation.status === 'trial'
                          ? 'border-yellow-500/30 text-yellow-700 bg-yellow-50'
                          : organisation.status === 'suspended'
                          ? 'border-red-500/30 text-red-700 bg-red-50'
                          : 'border-gray-200 text-gray-700 bg-gray-50'
                      }`}
                    >
                    {organisation.status ? organisation.status.charAt(0).toUpperCase() + organisation.status.slice(1) : 'Unknown'}
                  </Badge>
                  <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-[#006AFF] hover:text-[#006AFF] p-0 ml-auto">
                        {detailsOpen ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show More
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
                <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4 p-4 bg-gray-50 rounded-lg">
                      {organisation.slug && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">{organisation.slug}</span>
                        </div>
                      )}
                      
                      {organisation.is_internal !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">
                            {organisation.is_internal ? 'Internal Organization' : 'External Organization'}
                          </span>
                        </div>
                      )}

                      {organisation.created_at && (
                        <div className="flex items-center gap-2 ">
                          <span className="">
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
                <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg">Projects</h2>
                  <p className="text-sm text-[#0F172A]/60">All projects for {organisation.name}</p>
                </div>
                <Badge variant="outline" className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                  {hasPermission('projects.read') ? projects.length : 0}
                </Badge>
              </div>
            </div>

            {/* RBAC: Only show project grid if user has projects.read permission */}
            {hasPermission('projects.read') && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {projects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/projects/${project.id}`}
                    className="group block p-6 bg-white/80 backdrop-blur-sm rounded-md border border-[#0F172A]/10 hover:border-[#006AFF] transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg tracking-tight group-hover:text-[#006AFF] line-clamp-2 text-[#0F172A]">
                          {project.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold px-2 py-1 rounded-md ${
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

                      <div className="space-y-1 text-xs text-[#0F172A]">
                        {/* Organization Name Row - Consistent with Organisation Detail metadata list */}
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-3.5 w-3.5 text-[#006AFF]" />
                          <span className="truncate">{project.organisations?.name || 'No Organization'}</span>
                        </div>

                        {project.budget && (
                          <div className="flex items-center gap-2"> 
                            <DollarSign className="h-3.5 w-3.5 text-[#006AFF]" />
                            <p className="truncate">{project.currency || 'USD'}: {project.budget.toLocaleString()}</p>
                          </div>
                        )}
                        {project.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#006AFF]" />
                            <span className="tracking-wider">Start: {project.start_date}</span>
                          </div>
                        )}
                        {project.expected_end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#006AFF]" />
                            <span className="tracking-wider">End: {project.expected_end_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-lg mb-6">
                  <Building className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900">
                  {hasPermission('projects.read') ? "No Projects Yet" : "Access Restricted"}
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  {hasPermission('projects.read') 
                    ? "This organization does not have any projects yet." 
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