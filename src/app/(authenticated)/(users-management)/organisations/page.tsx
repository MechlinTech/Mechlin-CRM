"use client"

import React from 'react'
import { AddOrganisationButton } from "@/components/custom/organisations/add-organisation-button"
import { getAllOrganisationsAction } from "@/actions/user-management"
import { OrganisationsTable } from "../../../../components/custom/organisations/organisations-table"
import { useRBAC } from "@/context/rbac-context"
import { redirect } from "next/navigation"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function Page() {
    const [organisations, setOrganisations] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions
            const canRead = hasPermission('organisations.read')
            const isInternal = hasPermission('organisations.read') // Simple check for internal user
            
            if (!isInternal || !canRead) {
                redirect('/unauthorized')
                return
            }

            try {
                const result = await getAllOrganisationsAction()
                if (result.success) {
                    setOrganisations(result.organisations || [])
                } else {
                    setError(result.error || 'Failed to load organisations')
                }
            } catch (error) {
                console.error('Error fetching organisations:', error)
                setError('Failed to load organisations')
            } finally {
                setIsLoading(false)
            }
        }

        if (!rbacLoading) {
            fetchData()
        }
    }, [rbacLoading, hasPermission])

    const canCreate = hasPermission('organisations.create')

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading organisations...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Organisations</h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen ">
            <div className="px-4 sm:px-6 lg:px-8 ">
                <div className="max-w-7xl mx-auto ">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#0F172A]">All Organisations</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage your organization portfolios</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {organisations?.length || 0}
                            </div>
                        </div>
                        
                        {/* RBAC: Only show Add button if user has organisations.create permission */}
                        {canCreate && <AddOrganisationButton />}
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl   overflow-hidden p-2 ">
                        <OrganisationsTable organisations={organisations || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}