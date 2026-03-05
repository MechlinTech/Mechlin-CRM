"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAllPermissionsAction } from "@/actions/rbac"
import { assignUserPermissionAction, removeUserPermissionAction } from "@/actions/rbac"

interface EditUserPermissionsFormProps {
    user: any
    onSuccess?: () => void
}

export function EditUserPermissionsForm({ user, onSuccess }: EditUserPermissionsFormProps) {
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<any[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [initialPermissions, setInitialPermissions] = useState<string[]>([])
    const [permissionsByModule, setPermissionsByModule] = useState<Record<string, any[]>>({})
    const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadPermissions()
        
        // Get all permissions from roles
        const rolePerms = new Set<string>()
        if (user.user_roles && Array.isArray(user.user_roles)) {
            user.user_roles.forEach((ur: any) => {
                // The role data might be nested differently
                const roleData = ur.role || ur.roles || ur
                
                if (roleData && roleData.role_permissions) {
                    roleData.role_permissions.forEach((rp: any) => {
                        rolePerms.add(rp.permission_id)
                    })
                }
            })
        }
        setRolePermissionIds(rolePerms)
        
        // Set initial selected permissions from user's direct permissions
        if (user.user_permissions) {
            const permIds = user.user_permissions.map((up: any) => up.permission_id)
            setSelectedPermissions(permIds)
            setInitialPermissions(permIds)
        }
    }, [user])

    const loadPermissions = async () => {
        const result = await getAllPermissionsAction()
        if (result.success && result.permissions) {
            setPermissions(result.permissions)
            
            // Group by module
            const grouped = result.permissions.reduce((acc, perm) => {
                if (!acc[perm.module]) {
                    acc[perm.module] = []
                }
                acc[perm.module].push(perm)
                return acc
            }, {} as Record<string, any[]>)
            
            setPermissionsByModule(grouped)
        }
    }

    const togglePermission = (permissionId: string) => {
        // Don't allow toggling permissions that come only from roles
        if (rolePermissionIds.has(permissionId) && !selectedPermissions.includes(permissionId)) {
            return
        }
        
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    const toggleModule = (module: string) => {
        const modulePermissions = permissionsByModule[module] || []
        const modulePermissionIds = modulePermissions.map(p => p.id)
        const allDirectlySelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
        const allSelectedIncludingRoles = modulePermissionIds.every(id => selectedPermissions.includes(id) || rolePermissionIds.has(id))
        
        if (allDirectlySelected) {
            // Remove all direct permissions for this module
            setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)))
        } else {
            // Add all permissions for this module (only those not from roles)
            const toAdd = modulePermissionIds.filter(id => !rolePermissionIds.has(id))
            setSelectedPermissions(prev => [...new Set([...prev, ...toAdd])])
        }
    }

    const savePermissions = async () => {
        setLoading(true)
        try {
            // Calculate permissions to add and remove
            const toAdd = selectedPermissions.filter(id => !initialPermissions.includes(id))
            const toRemove = initialPermissions.filter(id => !selectedPermissions.includes(id))

            // Remove permissions
            if (toRemove.length > 0) {
                const removePromises = toRemove.map(id => 
                    removeUserPermissionAction(user.id, id)
                )
                await Promise.all(removePromises)
            }

            // Add permissions
            if (toAdd.length > 0) {
                const addPromises = toAdd.map(id => 
                    assignUserPermissionAction(user.id, id)
                )
                await Promise.all(addPromises)
            }

            if (toAdd.length > 0 || toRemove.length > 0) {
                toast.success(`Permissions updated successfully`)
                setInitialPermissions(selectedPermissions)
                onSuccess?.()
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#006AFF] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#0F172A]">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Direct Permissions</Label>
                    <span className="text-xs text-gray-500 bg-[#006AFF]/10 px-2 py-1 rounded-full border border-[#006AFF]/20">
                        {selectedPermissions.length} selected
                    </span>
                </div>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(permissionsByModule).map(([module, modulePerms]) => {
                        const modulePermissionIds = modulePerms.map(p => p.id)
                        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id) || rolePermissionIds.has(id))
                        const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id) || rolePermissionIds.has(id)) && !allSelected

                        return (
                            <div key={module} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                                    <Checkbox
                                        id={`module-${module}`}
                                        checked={allSelected}
                                        onCheckedChange={() => toggleModule(module)}
                                        className={someSelected ? "data-[state=checked]:bg-[#006AFF]/60" : ""}
                                        disabled={loading}
                                    />
                                    <Label
                                        htmlFor={`module-${module}`}
                                        className="text-sm font-semibold capitalize cursor-pointer text-gray-900"
                                    >
                                        {module}
                                    </Label>
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {modulePermissionIds.filter(id => selectedPermissions.includes(id)).length}/{modulePermissionIds.length} selected
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 pt-3">
                                    {modulePerms.map((permission) => {
                                        const isDirectPermission = user.user_permissions?.some((up: any) => up.permission_id === permission.id)
                                        const isFromRole = rolePermissionIds.has(permission.id)
                                        const isDisabled = isFromRole && !isDirectPermission
                                        
                                        return (
                                            <div key={permission.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                                <Checkbox
                                                    id={permission.id}
                                                    checked={selectedPermissions.includes(permission.id) || isFromRole}
                                                    onCheckedChange={() => !isDisabled && togglePermission(permission.id)}
                                                    disabled={loading || isDisabled}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label
                                                            htmlFor={permission.id}
                                                            className={`text-sm cursor-pointer font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}
                                                        >
                                                            {permission.display_name}
                                                        </Label>
                                                        {isFromRole && (
                                                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                                                {isDirectPermission ? 'Direct + Role' : 'From Role'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{permission.action}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 003.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 002.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 003.976 0 3.066 3.066 0 001.745-.723 3.066 3.066 0 002.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{selectedPermissions.length}</span> of {permissions.length} permissions selected
                </p>
                <Button
                    onClick={savePermissions}
                    disabled={loading}
                    className="bg-[#006AFF] hover:bg-[#0055CC]"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4.586"></path>
                            </svg>
                            Saving...
                        </span>
                    ) : "Done"}
                </Button>
            </div>
        </div>
    )
}
