"use client"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { deleteProjectAction } from "@/actions/projects"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditProjectDialog } from "./edit-project-dialog"

// FIX: Added 'users' parameter to match the call in projects-table.tsx
export const getColumns = (organisations: any[], users: any[]): ColumnDef<any>[] => [
  { accessorKey: "name", header: "Project Name" },
  { accessorKey: "organisations.name", header: "Organization" },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colorMap: Record<string, string> = {
        Active: "text-green-500 border-green-500/20 bg-green-500/10",
        Pending: "text-yellow-500 border-yellow-500/20 bg-yellow-500/10",
        Suspended: "text-red-500 border-red-500/20 bg-red-500/10",
      };
      return <Badge variant="outline" className={colorMap[status] || ""}>{status}</Badge>;
    } 
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original;
      
      const handleDelete = async () => {
        if(window.confirm("Are you sure you want to delete this project?")) {
            const res = await deleteProjectAction(project.id);
            if(res.success) toast.success("Project deleted successfully");
            else toast.error(res.error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white text-black border shadow-md w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`} className="flex items-center w-full cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div onClick={(e) => e.stopPropagation()}>
               <EditProjectDialog 
                 project={project} 
                 organisations={organisations} 
                 // If your EditProjectDialog also needs users, pass them here:
                 users={users} 
               />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600" 
                onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]