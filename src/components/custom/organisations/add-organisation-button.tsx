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

interface AddOrganisationButtonProps {
    onSuccess?: () => void
}

export function AddOrganisationButton({ onSuccess }: AddOrganisationButtonProps) {
    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess()
        }
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
