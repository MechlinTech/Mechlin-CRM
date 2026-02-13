"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createRoleAction, getAllPermissionsAction } from "@/actions/rbac"
import type { CreateRoleInput, Permission } from "@/types/rbac"

interface CreateRoleFormProps {
    onSuccess?: () => void
    showButton?: boolean
}

export function CreateRoleForm({ onSuccess, showButton = true }: CreateRoleFormProps) {
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<Omit<CreateRoleInput, "permission_ids">>()

    useEffect(() => {
        loadPermissions()
    }, [])

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
            }, {} as Record<string, Permission[]>)
            
            setPermissionsByModule(grouped)
        }
    }

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    const toggleModule = (module: string) => {
        const modulePermissions = permissionsByModule[module] || []
        const modulePermissionIds = modulePermissions.map(p => p.id)
        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
        
        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)))
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])])
        }
    }

    const onSubmit = async (data: Omit<CreateRoleInput, "permission_ids">) => {
        if (selectedPermissions.length === 0) {
            toast.error("Please select at least one permission")
            return
        }

        setLoading(true)
        try {
            const roleData: CreateRoleInput = {
                ...data,
                permission_ids: selectedPermissions,
            }

            const result = await createRoleAction(roleData)

            if (result.success) {
                toast.success("Role created successfully!")
                reset()
                setSelectedPermissions([])
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to create role")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="create-role-form">
            {/* Basic Information Section */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                </h3>
                
                <div>
                    <Label htmlFor="display_name" className="text-sm font-medium text-gray-700">
                        Display Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="display_name"
                        {...register("display_name", { required: "Display name is required" })}
                        placeholder="e.g., Project Manager"
                        className="mt-1.5"
                    />
                    {errors.display_name && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.display_name.message}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Internal Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        {...register("name", { 
                            required: "Internal name is required",
                            pattern: {
                                value: /^[a-z_]+$/,
                                message: "Use lowercase letters and underscores only"
                            }
                        })}
                        placeholder="e.g., project_manager"
                        className="mt-1.5 font-mono"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.name.message}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Use lowercase letters and underscores only
                    </p>
                </div>

                <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe the role's responsibilities..."
                        rows={3}
                        className="mt-1.5 resize-none"
                    />
                </div>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Permissions
                    </h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                        {selectedPermissions.length} selected
                    </span>
                </div>
                <div className="bg-white border rounded-lg p-3 max-h-[350px] overflow-y-auto space-y-3 shadow-inner">
                    {Object.entries(permissionsByModule).map(([module, modulePerms]) => {
                        const modulePermissionIds = modulePerms.map(p => p.id)
                        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                        const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id)) && !allSelected

                        return (
                            <div key={module} className="space-y-2">
                                <div className="flex items-center space-x-2 pb-2 border-b bg-gray-50 -mx-2 px-2 py-2 rounded">
                                    <Checkbox
                                        id={`module-${module}`}
                                        checked={allSelected}
                                        onCheckedChange={() => toggleModule(module)}
                                        className={someSelected ? "data-[state=checked]:bg-gray-400" : ""}
                                    />
                                    <Label
                                        htmlFor={`module-${module}`}
                                        className="text-sm font-semibold capitalize cursor-pointer flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                        {module}
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-6 pt-2">
                                    {modulePerms.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors">
                                            <Checkbox
                                                id={permission.id}
                                                checked={selectedPermissions.includes(permission.id)}
                                                onCheckedChange={() => togglePermission(permission.id)}
                                            />
                                            <Label
                                                htmlFor={permission.id}
                                                className="text-xs cursor-pointer text-gray-700"
                                            >
                                                {permission.display_name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Submit button at bottom */}
            <div className="flex justify-between items-center pt-4 border-t bg-gray-50 -mx-6 px-6 py-4 sticky bottom-0">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{selectedPermissions.length}</span> of {permissions.length} permissions selected
                </p>
                <Button
                    type="submit"
                    disabled={loading || selectedPermissions.length === 0}
                    className="bg-[#0F172A] hover:bg-[#0F172A]/90 shadow-lg min-w-[140px]"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </span>
                    ) : "Create Role"}
                </Button>
            </div>
        </form>
    )
}
