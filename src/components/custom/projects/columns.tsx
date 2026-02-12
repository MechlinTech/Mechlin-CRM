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
      
      // Exact color mapping matching the second screenshot logic
      const colorMap: Record<string, string> = {
        Active: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        Pending: "text-amber-500 border-amber-500/20 bg-amber-500/10",
        Suspended: "text-rose-500 border-rose-500/20 bg-rose-500/10",
      };

      return (
        <Badge 
          variant="outline" 
          className={`rounded-full px-3 py-0.5 text-[10px] font-medium border uppercase tracking-wider ${colorMap[status] || ""}`}
        >
          {status}
        </Badge>
      );
    } 
  },
  {
    id: "actions",
    header: "Actions", 
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
              <Link href={`/projects/${project.id}`} className="flex items-center w-full cursor-pointer text-[#060721]">
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div onClick={(e) => e.stopPropagation()}>
               <EditProjectDialog 
                 project={project} 
                 organisations={organisations} 
                 users={users} 
               />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
                className="text-[#060721] cursor-pointer " 
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