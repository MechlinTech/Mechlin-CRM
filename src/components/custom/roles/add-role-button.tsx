"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateRoleDialog } from "@/components/custom/roles/create-role-dialog"

export function AddRoleButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-[#006AFF] hover:bg-[#0055CC] text-white shadow-lg hover:shadow-xl transition-all"
            >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
            </Button>
            <CreateRoleDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    )
}
