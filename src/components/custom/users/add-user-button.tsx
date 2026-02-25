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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { CreateUserForm } from "./create-user-form"
import { InviteUserForm } from "./invite-user-form"
import { useState } from "react"

interface AddUserButtonProps {
    onSuccess?: () => void
}

export function AddUserButton({ onSuccess }: AddUserButtonProps) {
    const [open, setOpen] = useState(false)
    
    const handleSuccess = () => {
        setOpen(false)
        if (onSuccess) {
            onSuccess()
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                        Invite a new user via email
                         {/* or create a user account directly. */}
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="invite" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="invite">Send Invitation</TabsTrigger>
                        <TabsTrigger value="create">Create Directly</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="invite" className="mt-6">
                        <div className="space-y-4">
                            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Recommended:</strong> Send an email invitation to the user. 
                                    They will receive a secure link to set up their account.
                                </p>
                            </div> */}
                            <InviteUserForm onSuccess={handleSuccess} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="create" className="mt-6">
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>Note:</strong> Creating a user directly will add them to the system 
                                    without authentication. They will need to be invited separately.
                                </p>
                            </div>
                            <CreateUserForm onSuccess={handleSuccess} />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
