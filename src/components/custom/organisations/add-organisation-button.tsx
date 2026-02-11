"use client"

import React from "react"
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

interface AddOrganisationButtonProps {
    onSuccess?: () => void
}

export function AddOrganisationButton({ onSuccess }: AddOrganisationButtonProps) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    
    const handleSuccess = () => {
        setOpen(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    // Prevent hydration mismatch by waiting for client-side mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button variant="default" >Add Organisation</Button>
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="">Add Organisation</Button>
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
