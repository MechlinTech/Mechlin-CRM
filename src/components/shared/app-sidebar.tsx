"use client"
import * as React from "react"
import { ChevronRight, Folder, Award, CheckCircle, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SIDEBAR_NAVIGATION } from "@/config/navigation"
import { supabase } from "@/lib/supabase"
import { useRBAC } from "@/context/rbac-context"
import { useAuth } from "@/hooks/useAuth"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [projects, setProjects] = React.useState<any[]>([])
  const [hierarchyLoading, setHierarchyLoading] = React.useState(true)
  
  const { hasPermission, loading: rbacLoading } = useRBAC()
  const { user } = useAuth()

  const isUsersDashboard = pathname === '/users-dashboard'
  const isProjectsPage = pathname.startsWith('/projects/') && pathname !== '/projects'

  React.useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) return
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          project_id,
          projects!inner (
            *,
            organisations (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        const projectData = data?.map(item => item.projects) || []
        setProjects(projectData)
      }
      setHierarchyLoading(false)
    }

    const fetchProjectHierarchy = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          phases (
            id,
            name,
            milestones (
              id,
              name,
              sprints (
                id,
                name,
                status
              )
            )
          )
        `)
      
      if (error) {
        console.error(error)
      } else {
        setProjects(data || [])
      }
      setHierarchyLoading(false)
    }
    
    if (isUsersDashboard) {
      fetchUserProjects()
    } else if (isProjectsPage) {
      fetchProjectHierarchy()
    }
  }, [isUsersDashboard, isProjectsPage, user])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (rbacLoading || !mounted) {
    return (
      <Sidebar {...props} className="pt-10 overflow-y-hidden">
        <SidebarContent />
      </Sidebar>
    )
  }

  const renderProjectHierarchy = () => {
    // Show Dashboard text for normal users on ALL pages
    // Check if user is NOT an admin (doesn't have org management permissions)
    const canManageOrgs = hasPermission('organisations.read') || hasPermission('organisations.create') || hasPermission('organisations.update') || hasPermission('organisations.delete');
    const isNormalUser = !canManageOrgs;

    if (isNormalUser) {
      return (
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/users-dashboard'} className="font-medium py-3">
                <Link href="/users-dashboard">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )
    }

    // Project Pages - Show current project hierarchy for admins (no Dashboard text needed since they have it from main nav)
    if (isProjectsPage) {
      if (hierarchyLoading) {
        return (
          <SidebarGroup>
            <SidebarGroupLabel>Current Project</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <span className="text-sm text-zinc-500 p-2">Loading project...</span>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )
      }

      const currentProjectId = pathname.match(/\/projects\/([a-f0-9-]+)/)?.[1]
      const currentProject = projects.find(p => p.id === currentProjectId)

      if (!currentProject) return null

      return (
        <Collapsible key="current-project" defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <SidebarMenuButton asChild>
                <CollapsibleTrigger>
                  Current Project: {currentProject.name}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarMenuButton>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {currentProject.phases?.map((phase: any) => (
                    <Collapsible key={phase.id} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-sm">
                          <CollapsibleTrigger>
                            <Folder className="mr-2 h-3 w-3 text-blue-500" />
                            <Link href={`/projects/${currentProject.id}`}>
                              <span>{phase.name}</span>
                            </Link>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                        </SidebarMenuButton>
                        <CollapsibleContent>
                          <SidebarMenu className="ml-4">
                            {phase.milestones?.map((milestone: any) => (
                              <Collapsible key={milestone.id} className="group/collapsible">
                                <SidebarMenuItem>
                                  <SidebarMenuButton asChild className="text-xs">
                                    <CollapsibleTrigger>
                                      <Award className="mr-2 h-3 w-3 text-purple-500" />
                                      <Link href={`/projects/${currentProject.id}/phases/${phase.id}/milestones/${milestone.id}`}>
                                        <span>{milestone.name}</span>
                                      </Link>
                                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                    </CollapsibleTrigger>
                                  </SidebarMenuButton>
                                  <CollapsibleContent>
                                    <SidebarMenu className="ml-4">
                                      {milestone.sprints?.map((sprint: any) => (
                                        <SidebarMenuItem key={sprint.id}>
                                          <SidebarMenuButton asChild className="text-xs">
                                            <Link href={`/projects/${currentProject.id}/phases/${phase.id}/milestones/${milestone.id}/sprints/${sprint.id}`}>
                                              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                              <span>{sprint.name}</span>
                                            </Link>
                                          </SidebarMenuButton>
                                        </SidebarMenuItem>
                                      ))}
                                    </SidebarMenu>
                                  </CollapsibleContent>
                                </SidebarMenuItem>
                              </Collapsible>
                            ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      )
    }

    return null
  }

  return (
    <Sidebar {...props} className="pt-12">
      <SidebarContent className="gap-0">
        {SIDEBAR_NAVIGATION.map((item) => {
          // DASHBOARD Visibility (Checks any Organisation CRUD) [cite: 1]
          const canManageOrgs = hasPermission('organisations.read') || hasPermission('organisations.create') || hasPermission('organisations.update') || hasPermission('organisations.delete');
          
          if (item.title === "Dashboard" && !canManageOrgs) {
            return null;
          }

          // ORGANIZATION MANAGEMENT Visibility (Checks any Organisation CRUD) [cite: 1]
          if (item.title === "Organization Management") {
            if (!canManageOrgs) return null;

            return (
              <Collapsible key={item.title} defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <SidebarMenuButton asChild>
                      <CollapsibleTrigger>
                        {item.title}
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarMenuButton>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {item.items?.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          }

          // PROJECT MANAGEMENT Visibility (Requires reading projects) [cite: 1]
          const canManageProjects = hasPermission('projects.create') || hasPermission('projects.update') || hasPermission('projects.delete') || hasPermission('projects.manage_members');
          
          if (item.title === "Project Management" && !canManageProjects) {
            return null;
          }

          // USER MANAGEMENT LOGIC [cite: 1, 2]
          if (item.title === "User Management") {
            const canManageUsers = hasPermission('users.read') || hasPermission('users.create') || hasPermission('users.update') || hasPermission('users.delete');
            const canAssignRoles = hasPermission('users.assign_roles');
            const canManageRoles = hasPermission('roles.read') || hasPermission('roles.create') || hasPermission('roles.update') || hasPermission('roles.delete');

            if (!canManageUsers && !canAssignRoles && !canManageRoles) return null;

            const filteredSubItems = item.items?.filter(sub => {
              if (sub.title === "Users") return canManageUsers;
              if (sub.title === "Role Based Permissions") return canManageRoles;
              if (sub.title === "User Permissions") return canAssignRoles || canManageUsers;
              return true;
            });

            if (!filteredSubItems || filteredSubItems.length === 0) return null;

            return (
              <Collapsible key={item.title} defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <SidebarMenuButton asChild>
                      <CollapsibleTrigger>
                        {item.title}
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarMenuButton>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredSubItems.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          }

          const isDirectLink = item.url && (!item.items || item.items.length === 0);
          if (isDirectLink) {
            return (
              <SidebarGroup key={item.title}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === item.url} className="font-medium py-3">
                      <Link href={item.url}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }
          return null;
        })}
        
        {renderProjectHierarchy()}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}