"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CreateProjectForm } from "./create-project-form"
import { useRBAC } from "@/context/rbac-context" // Added RBAC Integration

export function AddProjectButton({ organisations, users }: { organisations: any[], users: any[] }) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { hasPermission, loading } = useRBAC(); // Added RBAC Hook

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // RBAC: Only show the button if user has permission to create projects
    if (!loading && !hasPermission('projects.create')) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="cursor-pointer active:scale-95 transition-all">Add Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-white text-[#0F172A] max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[24px]">
                <DialogHeader className="p-2">
                    <DialogTitle className="text-xl font-semibold tracking-tight text-[#0F172A]">Add New Project</DialogTitle>
                    <DialogDescription className="text-slate-500 font-normal">
                        Create a new project and assign team members.
                    </DialogDescription>
                </DialogHeader>
                <CreateProjectForm 
                    organisations={organisations} 
                    users={users} 
                    onSuccess={() => setOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    )
}