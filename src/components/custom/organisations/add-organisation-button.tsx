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

export function AddOrganisationButton() {
    const [open, setOpen] = useState(false)
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <CreateOrganisationForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
