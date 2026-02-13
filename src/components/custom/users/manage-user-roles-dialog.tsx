"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    getSystemRolesAction, 
    getUserRolesAction, 
    updateUserRolesAction 
} from "@/actions/rbac"
import { Button } from "@/components/ui/button"
import type { Role } from "@/types/rbac"

interface ManageUserRolesDialogProps {
    user: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ManageUserRolesDialog({ user, open, onOpenChange }: ManageUserRolesDialogProps) {
    const [loading, setLoading] = useState(false)
    const [availableRoles, setAvailableRoles] = useState<Role[]>([])
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [initialRoles, setInitialRoles] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, user])

    const loadData = async () => {
        // Load available roles
        const rolesResult = await getSystemRolesAction()
        if (rolesResult.success && rolesResult.roles) {
            setAvailableRoles(rolesResult.roles)
        }

        // Load user's current roles
        const userRolesResult = await getUserRolesAction(user.id)
        if (userRolesResult.success && userRolesResult.userRoles) {
            const roleIds = userRolesResult.userRoles.map((ur: any) => ur.role_id)
            setSelectedRoles(roleIds)
            setInitialRoles(roleIds)
        }
    }

    const toggleRole = (roleId: string) => {
        setSelectedRoles(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        )
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateUserRolesAction(user.id, selectedRoles)

            if (result.success) {
                toast.success("User roles updated successfully!")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to update user roles")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(initialRoles.sort())

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Roles</DialogTitle>
                    <DialogDescription>
                        Assign roles to {user?.name || user?.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current user info */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                        {user?.organisations?.name && (
                            <p className="text-xs text-gray-500">
                                Organisation: {user.organisations.name}
                            </p>
                        )}
                    </div>

                    {/* Roles selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Available Roles</Label>
                        <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                            {availableRoles.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No roles available
                                </p>
                            ) : (
                                availableRoles.map((role) => (
                                    <div key={role.id} className="flex items-start space-x-3">
                                        <Checkbox
                                            id={role.id}
                                            checked={selectedRoles.includes(role.id)}
                                            onCheckedChange={() => toggleRole(role.id)}
                                        />
                                        <div className="flex-1 space-y-1">
                                            <Label
                                                htmlFor={role.id}
                                                className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                            >
                                                {role.display_name}
                                                {role.is_system_role && (
                                                    <Badge variant="outline" className="text-xs">
                                                        System
                                                    </Badge>
                                                )}
                                            </Label>
                                            {role.description && (
                                                <p className="text-xs text-gray-600">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Selected {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={loading || !hasChanges}
                            className="bg-[#0F172A] hover:bg-[#0F172A]/90"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
