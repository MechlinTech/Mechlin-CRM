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
import { useRBAC } from "@/context/rbac-context" // RBAC Integration

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [projects, setProjects] = React.useState<any[]>([])
  const [hierarchyLoading, setHierarchyLoading] = React.useState(true)
  
  // RBAC Hook to manage sidebar visibility
  const { hasPermission, loading: rbacLoading } = useRBAC()

  const isProjectsPage = pathname.startsWith('/projects/') && pathname !== '/projects'

  React.useEffect(() => {
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
    
    if (isProjectsPage) {
      fetchProjectHierarchy()
    }
  }, [isProjectsPage])

  React.useEffect(() => {
    setMounted(true)
  }, [])
    if (rbacLoading) {
    return (
      <Sidebar {...props} className="pt-10 overflow-y-hidden">
        <SidebarContent />
      </Sidebar>
    )
  }

  if (!mounted) {
    return (
      <Sidebar {...props} className="pt-10 overflow-y-hidden">
        <SidebarContent />
      </Sidebar>
    )
  }

  const renderProjectHierarchy = () => {
    if (!isProjectsPage) {
      return null
    }

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

    const currentProjectId = pathname.match(/\/projects\/([a-f0-9-]+)(?:\/phases\/[a-f0-9-]+\/milestones\/[a-f0-9-]+\/sprints\/[a-f0-9-]+)?/)?.[1]
    const currentProject = projects.find(p => p.id === currentProjectId)

    if (!currentProject) {
      return null 
    }

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
                                        <SidebarMenuButton 
                                          asChild 
                                          className="text-xs"
                                        >
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

  return (
    <Sidebar {...props} className="pt-12">
      <SidebarContent className="gap-0">
        {SIDEBAR_NAVIGATION.map((item) => {
          // RBAC Filtering Logic: 
          // dashboard, project management, and user management are administrative zones
          // We check for "Create" permissions as requested to identify Admin/Super Admin status
          const isUserManagement = item.title.toLowerCase().includes("user");
          const isProjectManagement = item.title.toLowerCase().includes("project");
          const isDashboard = item.title.toLowerCase() === "dashboard";

          if (!rbacLoading) {
            // Requirement: Only show User Management to those who can add users/roles
            if (isUserManagement && !(hasPermission('users.create') || hasPermission('roles.create'))) {
              return null;
            }
            // Requirement: Only show Project Management to those who can create projects
            if (isProjectManagement && !hasPermission('projects.create')) {
              return null;
            }
            // Requirement: Only show primary Dashboard to admins (who have organisation creation rights)
            if (isDashboard && !hasPermission('organisations.create')) {
              return null;
            }
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
        })}
        
        {renderProjectHierarchy()}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}