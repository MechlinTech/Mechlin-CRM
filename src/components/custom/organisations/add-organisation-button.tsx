"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { CreateOrganisationForm } from "./create-organisation-form"
import { useRBAC } from "@/context/rbac-context"

interface AddOrganisationButtonProps {
    onSuccess?: () => void
}

export function AddOrganisationButton({ onSuccess }: AddOrganisationButtonProps) {
    const { hasPermission, loading } = useRBAC();
    const [open, setOpen] = useState(false)
    
    const handleSuccess = () => {
        // Close the dialog
        setOpen(false)
        
        // Call parent onSuccess if provided
        if (onSuccess) {
            onSuccess()
        }
    }
    
    // RBAC: Hide button if user cannot create organisations
    if (loading || !hasPermission('organisations.create')) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" onClick={() => setOpen(true)}>Add Organisation</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add Organisation</DialogTitle>
                <DialogDescription>
                    This action will create a new organisation.
                </DialogDescription>
                </DialogHeader>
                <CreateOrganisationForm onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    )
}