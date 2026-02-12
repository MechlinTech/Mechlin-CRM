"use client"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateProjectForm } from "./create-project-form"

export function EditProjectDialog({ project, organisations, users }: { project: any, organisations: any[], users: any[] }) {
  const [open, setOpen] = useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-[#060721]">
          <Pencil className="mr-2 h-4 w-4 h-4"/> Edit Project
        </div>
      </DialogTrigger>
      {/* Added max-h and scrolling to content */}
      <DialogContent className="max-w-2xl bg-white text-black border-none shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold cursor-pointer">Edit Project: {project.name}</DialogTitle>
        </DialogHeader>
        <CreateProjectForm 
          project={project} 
          onSuccess={() => setOpen(false)} 
          organisations={organisations} 
          users={users} 
        />
      </DialogContent>
    </Dialog>
  )
}