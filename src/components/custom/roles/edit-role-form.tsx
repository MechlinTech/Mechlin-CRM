"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateRoleAction, getAllPermissionsAction } from "@/actions/rbac"
import type { UpdateRoleInput, Permission } from "@/types/rbac"

interface EditRoleFormProps {
    role: any
    onSuccess?: () => void
}

export function EditRoleForm({ role, onSuccess }: EditRoleFormProps) {
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Omit<UpdateRoleInput, "permission_ids">>({
        defaultValues: {
            display_name: role.display_name,
            name: role.name,
            description: role.description || "",
            is_active: role.is_active,
        }
    })

    useEffect(() => {
        loadPermissions()
        
        // Set initial selected permissions
        if (role.role_permissions) {
            const permIds = role.role_permissions.map((rp: any) => rp.permission_id)
            setSelectedPermissions(permIds)
        }
    }, [role])

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

    const onSubmit = async (data: Omit<UpdateRoleInput, "permission_ids">) => {
        if (selectedPermissions.length === 0) {
            toast.error("Please select at least one permission")
            return
        }

        setLoading(true)
        try {
            const roleData: UpdateRoleInput = {
                ...data,
                permission_ids: selectedPermissions,
            }

            const result = await updateRoleAction(role.id, roleData)

            if (result.success) {
                toast.success("Role updated successfully!")
                onSuccess?.()
            } else {
                toast.error(result.error || "Failed to update role")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                        id="display_name"
                        {...register("display_name", { required: "Display name is required" })}
                        placeholder="e.g., Project Manager"
                    />
                    {errors.display_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.display_name.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="name">Internal Name</Label>
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
                        disabled={role.is_system_role}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                    {role.is_system_role && (
                        <p className="text-xs text-amber-600 mt-1">
                            System role name cannot be changed
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe the role's responsibilities..."
                        rows={3}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_active"
                        {...register("is_active")}
                        defaultChecked={role.is_active}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                        Active (users with this role can access the system)
                    </Label>
                </div>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Permissions</Label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border">
                        {selectedPermissions.length} selected
                    </span>
                </div>
                <div className="border rounded-lg p-4 max-h-[350px] overflow-y-auto space-y-4">
                    {Object.entries(permissionsByModule).map(([module, modulePerms]) => {
                        const modulePermissionIds = modulePerms.map(p => p.id)
                        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                        const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id)) && !allSelected

                        return (
                            <div key={module} className="space-y-2">
                                <div className="flex items-center space-x-2 pb-2 border-b">
                                    <Checkbox
                                        id={`module-${module}`}
                                        checked={allSelected}
                                        onCheckedChange={() => toggleModule(module)}
                                        className={someSelected ? "data-[state=checked]:bg-gray-400" : ""}
                                    />
                                    <Label
                                        htmlFor={`module-${module}`}
                                        className="text-sm font-semibold capitalize cursor-pointer"
                                    >
                                        {module}
                                    </Label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pl-6">
                                    {modulePerms.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={permission.id}
                                                checked={selectedPermissions.includes(permission.id)}
                                                onCheckedChange={() => togglePermission(permission.id)}
                                            />
                                            <Label
                                                htmlFor={permission.id}
                                                className="text-sm cursor-pointer"
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

            {/* Actions */}
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
                            Updating...
                        </span>
                    ) : "Update Role"}
                </Button>
            </div>
        </form>
    )
}
