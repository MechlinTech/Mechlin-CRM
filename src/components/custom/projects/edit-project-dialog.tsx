"use client"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateProjectForm } from "./create-project-form"

// FIX: Added 'users' to the type definition and the component arguments
export function EditProjectDialog({ project, organisations, users }: { project: any, organisations: any[], users: any[] }) {
  const [open, setOpen] = useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          <Pencil className="mr-2 h-4 w-4" /> Edit Project
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white text-black border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Project: {project.name}</DialogTitle>
        </DialogHeader>
        <CreateProjectForm 
          project={project} 
          onSuccess={() => setOpen(false)} 
          organisations={organisations} 
          // FIX: Pass users down to the form so they show up in the edit state
          users={users} 
        />
      </DialogContent>
    </Dialog>
  )
}