"use client"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteRoleAction } from "@/actions/rbac"
import { ActionButton } from "@/components/shared/action-button"

interface DeleteRoleDialogProps {
    role: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteRoleDialog({ role, open, onOpenChange }: DeleteRoleDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteRoleAction(role.id)

            if (result.success) {
                toast.success("Role deleted successfully!")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to delete role")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Role</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the role "{role?.display_name}"?
                        This action cannot be undone. Users with this role will lose their
                        associated permissions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <ActionButton
                        onClick={handleDelete}
                        loading={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </ActionButton>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
