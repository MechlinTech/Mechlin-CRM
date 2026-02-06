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

export function AddProjectButton({ organisations, users }: { organisations: any[], users: any[] }) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Add Project</Button>
            </DialogTrigger>
            {/* Added max-h and scrolling to content */}
            <DialogContent className="max-w-2xl bg-white text-black max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>
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