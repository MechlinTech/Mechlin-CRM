"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
// import { EditRoleForm } from "./edit-role-form"
import { EditRoleForm } from "@/components/custom/roles/edit-role-form"

interface EditRoleDialogProps {
    role: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({ role, open, onOpenChange }: EditRoleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <div className="sticky top-0 bg-gradient-to-r from-[#0F172A] to-[#1e293b] px-6 py-5 border-b z-10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Edit Role: {role?.display_name}</DialogTitle>
                        <DialogDescription className="text-gray-300 text-sm">
                            Update role information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="px-6 py-4">
                    <EditRoleForm role={role} onSuccess={() => onOpenChange(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
