"use client"

import React from 'react'
import { AddUserButton } from "@/components/custom/users/add-user-button"
import { getAllUsersAction } from "@/actions/user-management"
import { UsersTable } from "@/components/custom/users/users-table"
import { useRBAC } from "@/context/rbac-context"
import { redirect } from "next/navigation"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function Page() {
    const [users, setUsers] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions
            const canRead = hasPermission('users.read')
            const canCreate = hasPermission('users.create')
            const canUpdate = hasPermission('users.update')
            const canDelete = hasPermission('users.delete')

            // FIX: Only redirect if the user has NO user-related permissions at all
            if (!canRead && !canCreate && !canUpdate && !canDelete) {
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

    const canCreate = hasPermission('users.create')

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading users...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Users</h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="p-0">
            <div className="px-4 sm:px-6 lg:px-8 ">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section with Inline Button */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#006AFF] rounded-xl shadow-lg">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-heading-primary">All Users</h1>
                                <p className="text-xs text-[#6C7F93]">Manage your team members and collaborators</p>
                            </div>
                            <div className="bg-[#006AFF]/10 text-heading-primary border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                                {users?.length || 0}
                            </div>
                        </div>
                        
                        {/* RBAC: Only show Add button if user has users.create permission */}
                        {/* {canCreate && <AddUserButton />} */}
                    </div>

                    {/* Enhanced Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <UsersTable users={users || []} />
                    </div>
                </div>
            </div>
    </div>
    );
}