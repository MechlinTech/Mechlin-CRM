"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { updateRoleAction, getAllPermissionsAction } from "@/actions/rbac"
import type { UpdateRoleInput, Permission } from "@/types/rbac"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { useAuth } from "@/hooks/useAuth"

interface EditRoleFormProps {
    role: any
    onSuccess?: () => void
}

export function EditRoleForm({ role, onSuccess }: EditRoleFormProps) {
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})
    const [status, setStatus] = useState<string>(role.is_active ? "active" : "inactive")
    const { isAdminOnly, loading: adminLoading } = useIsAdmin()
    const { user } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Omit<UpdateRoleInput, "permission_ids" | "name" | "is_active">>({
        defaultValues: {
            display_name: role.display_name,
            description: role.description || "",
        }
    })

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

    useEffect(() => {
        loadPermissions()
        
        // Set initial selected permissions
        if (role.role_permissions) {
            const permIds = role.role_permissions.map((rp: any) => rp.permission_id)
            setSelectedPermissions(permIds)
        }
    }, [role])

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

    const onSubmit = async (data: Omit<UpdateRoleInput, "permission_ids" | "name" | "is_active">) => {
        if (selectedPermissions.length === 0) {
            toast.error("Please select at least one permission")
            return
        }

        setLoading(true)
        try {
            const roleData: UpdateRoleInput = {
                ...data,
                name: role.name, // Keep original name
                permission_ids: selectedPermissions,
                is_active: status === "active",
            }

            const result = await updateRoleAction(role.id, roleData, user?.id)

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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="Describe the role's responsibilities..."
                        rows={3}
                    />
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Permissions</Label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border">
                        {selectedPermissions.length} selected
                    </span>
                </div>
                <div className="space-y-6">
                    {Object.entries(permissionsByModule).map(([module, modulePerms]) => {
                        const modulePermissionIds = modulePerms.map(p => p.id)
                        const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                        const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id)) && !allSelected

                        return (
                            <div key={module} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                                    <Checkbox
                                        id={`module-${module}`}
                                        checked={allSelected}
                                        onCheckedChange={() => toggleModule(module)}
                                        className={someSelected ? "data-[state=checked]:bg-gray-400" : ""}
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
                                    {modulePerms.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                            <Checkbox
                                                id={permission.id}
                                                checked={selectedPermissions.includes(permission.id)}
                                                onCheckedChange={() => togglePermission(permission.id)}
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={permission.id}
                                                    className="text-sm cursor-pointer font-medium text-gray-900"
                                                >
                                                    {permission.display_name}
                                                </Label>
                                                <p className="text-xs text-gray-500 mt-1">{permission.action}</p>
                                            </div>
                                        </div>
                                    ))}
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
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 002.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{selectedPermissions.length}</span> of {permissions.length} permissions selected
                </p>
                <Button
                    type="submit"
                    disabled={loading || selectedPermissions.length === 0}
                    className="bg-[#006AFF] hover:bg-[#0055CC] shadow-lg min-w-[140px]"
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
