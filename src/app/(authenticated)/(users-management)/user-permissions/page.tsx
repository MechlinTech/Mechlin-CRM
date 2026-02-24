"use client"

import React from 'react'
import { getAllUsersAction } from "@/actions/user-management"
import { UserPermissionsTable } from "@/components/custom/user-permissions/user-permissions-table"
import { useRBAC } from "@/context/rbac-context"
import { redirect } from "next/navigation"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function UserPermissionsPage() {
    const [users, setUsers] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()

    // Check if user has admin or super admin role
    if (!isAdmin() && !isSuperAdmin()) {
        redirect('/unauthorized')
    }

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions
            const canReadUsers = hasPermission('users.read')
            const canCreateUsers = hasPermission('users.create')
            const canUpdateUsers = hasPermission('users.update')
            const canDeleteUsers = hasPermission('users.delete')
            const canAssignRoles = hasPermission('users.assign_roles')

            // FIX: Allow access if the user has ANY user-related management or assignment permission 
            if (!canReadUsers && !canCreateUsers && !canUpdateUsers && !canDeleteUsers && !canAssignRoles) {
                redirect('/unauthorized')
                return
            }

            try {
                const result = await getAllUsersAction()
                if (result.success) {
                    setUsers(result.users || [])
                } else {
                    setError(result.error || 'Failed to load users')
                }
            } catch (error) {
                console.error('Error fetching users:', error)
                setError('Failed to load users')
            } finally {
                setIsLoading(false)
            }
        }

        if (!rbacLoading) {
            fetchData()
        }
    }, [rbacLoading, hasPermission])

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading user permissions...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading User Permissions</h2>
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
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-[#006AFF] rounded">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#0F172A]">User Permissions</h1>
                            <p className="text-xs text-[#0F172A]/60">Manage direct user permissions</p>
                        </div>
                        <div className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                            {users?.length || 0}
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                        <UserPermissionsTable users={users || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}