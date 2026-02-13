"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { EditRoleForm } from "@/components/custom/roles/edit-role-form"

interface EditRoleDialogProps {
    role: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({ role, open, onOpenChange }: EditRoleDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">

                {/* Sticky Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#006AFF] to-[#0055CC] px-6 py-5 border-b z-10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">
                            Edit Role: {role?.display_name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-300 text-sm">
                            Update role information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Scroll Area Only */}
                <div className="px-6 py-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <EditRoleForm
                        role={role}
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>

            </DialogContent>
        </Dialog>
    )
}
