"use client"

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
    
    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess()
        }
    }
    
    // RBAC: Hide button if user cannot create organisations
    if (loading || !hasPermission('organisations.create')) {
        return null;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default">Add Organisation</Button>
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