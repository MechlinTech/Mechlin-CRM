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
import { CreateUserForm } from "./create-user-form"

interface AddUserButtonProps {
    onSuccess?: () => void
}

export function AddUserButton({ onSuccess }: AddUserButtonProps) {
    const handleSuccess = () => {
        if (onSuccess) {
            onSuccess()
        }
    }
    
    return (
        <Dialog>
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
                <CreateUserForm onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    )
}
