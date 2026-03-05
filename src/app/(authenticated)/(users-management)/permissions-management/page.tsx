"use client"

import React from 'react'
import { getAllPermissionsAction, updatePermissionAction } from "@/actions/rbac"
import { useRBAC } from "@/context/rbac-context"
import { redirect } from "next/navigation"
import { toast } from 'sonner'

interface Permission {
    id: string
    name: string
    display_name: string
    description?: string
    module: string
    action: string
    is_internal?: boolean
    created_at: string
    updated_at: string
}

export default function PermissionsManagementPage() {
    const [permissions, setPermissions] = React.useState<Permission[]>([])
    const [originalPermissions, setOriginalPermissions] = React.useState<Permission[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [hasChanges, setHasChanges] = React.useState(false)
    
    const { hasPermission, loading: rbacLoading } = useRBAC()

    React.useEffect(() => {
        async function fetchData() {
            // Check permissions - only allow users with permission management permissions
            const canViewPermissions = hasPermission('permissions.view')
            const canUpdatePermissions = hasPermission('permissions.update')

            if (!canViewPermissions && !canUpdatePermissions) {
                redirect('/unauthorized')
                return
            }

            try {
                const result = await getAllPermissionsAction()
                if (result.success) {
                    const permissionsData = result.permissions || []
                    setPermissions(permissionsData)
                    setOriginalPermissions(permissionsData)
                } else {
                    setError(result.error || 'Failed to load permissions')
                }
            } catch (error) {
                console.error('Error fetching permissions:', error)
                setError('Failed to load permissions')
            } finally {
                setIsLoading(false)
            }
        }

        if (!rbacLoading) {
            fetchData()
        }
    }, [rbacLoading, hasPermission])

    const handleToggleInternal = (permissionId: string, currentValue: boolean) => {
        setPermissions(prev => 
            prev.map(p => 
                p.id === permissionId 
                    ? { ...p, is_internal: !currentValue }
                    : p
            )
        )
        setHasChanges(true)
    }

    const handleSaveChanges = async () => {
        setIsSaving(true)
        
        try {
            // Find all permissions that have changed
            const changedPermissions = permissions.filter(permission => {
                const original = originalPermissions.find(p => p.id === permission.id)
                return original && original.is_internal !== permission.is_internal
            })

            // Update all changed permissions
            const updatePromises = changedPermissions.map(permission => 
                updatePermissionAction(permission.id, { 
                    is_internal: permission.is_internal 
                })
            )

            const results = await Promise.all(updatePromises)
            
            // Check if all updates were successful
            const hasErrors = results.some(result => !result.success)
            
            if (hasErrors) {
                toast.error('Some permissions failed to update')
            } else {
                toast.success(`Successfully updated ${changedPermissions.length} permission${changedPermissions.length !== 1 ? 's' : ''}`)
                setOriginalPermissions(permissions)
                setHasChanges(false)
            }
        } catch (error) {
            console.error('Error updating permissions:', error)
            toast.error('Failed to update permissions')
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setPermissions(originalPermissions)
        setHasChanges(false)
    }

    if (rbacLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006AFF] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading permissions...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-red-800 font-semibold mb-2">Error Loading Permissions</h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
            acc[permission.module] = []
        }
        acc[permission.module].push(permission)
        return acc
    }, {} as Record<string, Permission[]>)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Save Button */}
            {hasChanges && (
                <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-700">Unsaved changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            )}
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-[#006AFF] rounded">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#0F172A]">Permissions Management</h1>
                            <p className="text-xs text-[#0F172A]/60">Configure permission internal status</p>
                        </div>
                        <div className="bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20 font-semibold px-3 py-1 rounded-full text-xs">
                            {permissions?.length || 0}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                            <div key={module} className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 capitalize">
                                        {module.replace('_', ' ')} Module
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                
                                <div className="divide-y divide-gray-100">
                                    {modulePermissions.map((permission: Permission) => (
                                        <div 
                                            key={permission.id} 
                                            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            {permission.display_name}
                                                        </h4>
                                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {permission.name}
                                                        </span>
                                                        {permission.is_internal && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                                Internal
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {permission.description || 'No description available'}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-xs text-gray-500">
                                                            Action: <span className="font-medium">{permission.action}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={permission.is_internal || false}
                                                            onChange={() => handleToggleInternal(permission.id, permission.is_internal || false)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        <span className="ml-3 text-xs text-gray-700">
                                                            Internal
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {permissions.length === 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No permissions found</h3>
                            <p className="text-xs text-gray-500">Get started by creating some permissions in the system.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
