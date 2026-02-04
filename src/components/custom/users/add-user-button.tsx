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
import { CreateUserForm } from "./create-user-form"

export function AddUserButton() {
    const [open, setOpen] = useState(false)
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Add User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>
                    This action will create a new user.
                </DialogDescription>
                </DialogHeader>
                <CreateUserForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
