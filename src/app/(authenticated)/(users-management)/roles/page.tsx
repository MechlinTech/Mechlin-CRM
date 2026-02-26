"use client"

import React from 'react'
import { AddRoleButton } from "@/components/custom/roles/add-role-button"
import { getAllRolesAction, getUserOrganisationWithInternalAction } from "@/actions/rbac"
import { RolesTable } from "@/components/custom/roles/roles-table"
import { useRBAC } from "@/context/rbac-context"
import { redirect } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function RolesPage() {
    const [roles, setRoles] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()
    const { user } = useAuth()

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions
            const canRead = hasPermission('roles.read')
            const canCreate = hasPermission('roles.create')
            const canUpdate = hasPermission('roles.update')
            const canDelete = hasPermission('roles.delete')

            // FIX: Only redirect if the user has NO role-related permissions at all
            if (!canRead && !canCreate && !canUpdate && !canDelete) {
                redirect('/unauthorized')
                return
            }

            try {
                // Get user's organization with is_internal flag using proper action
                const orgResult = await getUserOrganisationWithInternalAction(user?.id || "")
                
                if (!orgResult.success) {
                    setError(orgResult.error || 'Failed to load organization information')
                    return
                }

                const organisation = orgResult.organisation?.organisations?.[0]
                const isInternalOrg = organisation?.is_internal || false

                let result
                if (isInternalOrg) {
                    // For internal organizations, show all roles (system + custom from all orgs)
                    result = await getAllRolesAction(undefined) // undefined = no org filter
                } else {
                    // For external organizations, show only system roles + their org's custom roles
                    result = await getAllRolesAction(organisation?.id)
                }

                if (result.success) {
                    setRoles(result.roles || [])
                } else {
                    setError(result.error || 'Failed to load roles')
                }
            } catch (error) {
                console.error('Error fetching roles:', error)
                setError('Failed to load roles')
            } finally {
                setIsLoading(false)
            }
        }

        if (!rbacLoading && user) {
            fetchData()
        }
    }, [rbacLoading, hasPermission, user])

    const canCreate = hasPermission('roles.create')

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading roles...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Roles</h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-50">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#0F172A]">Role Based Permissions</h1>
                                <p className="text-xs text-[#0F172A]/60">Manage roles and access control</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-[#006AFF] border-[#006AFF]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {roles?.length || 0}
                            </div>
                        </div>
                        
                        {/* RBAC: Only show Add button if user has roles.create permission */}
                        {canCreate && <AddRoleButton />}
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                        <RolesTable roles={roles || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}