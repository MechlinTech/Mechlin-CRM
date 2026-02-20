"use client"
import * as React from "react"
import { ChevronRight, Folder, Award, CheckCircle, LayoutGrid, User, Settings, LogOut, PanelLeft } from "lucide-react"
import Image from "next/image"
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
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SIDEBAR_NAVIGATION } from "@/config/navigation"
import { supabase } from "@/lib/supabase"
import { useRBAC } from "@/context/rbac-context"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { getUserRoles, isInternalUser } from "@/lib/permissions"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [projects, setProjects] = React.useState<any[]>([])
  const [hierarchyLoading, setHierarchyLoading] = React.useState(true)
  const [dashboardUrl, setDashboardUrl] = React.useState("")
  const [isAdminWithInternalFalse, setIsAdminWithInternalFalse] = React.useState(false)
  
  const { hasPermission, loading: rbacLoading } = useRBAC()
  const { user } = useAuth()
  const { state } = useSidebar()

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

  // Fetch user roles and is_internal status to determine dashboard URL and Project Management visibility
  React.useEffect(() => {
    const determineDashboardUrl = async () => {
      if (!user) return

      try {
        const [roles, isInternal] = await Promise.all([
          getUserRoles(),
          isInternalUser()
        ])

        const isSuperAdmin = roles.includes("super_admin")
        const isAdmin = roles.includes("admin")

        // Track if user is admin with is_internal === false (for Project Management visibility)
        setIsAdminWithInternalFalse(isAdmin && !isInternal)

        // Super admin OR (admin AND is_internal === true) → /dashboard
        // Admin AND is_internal === false → /admin-dashboard
        if (isSuperAdmin || (isAdmin && isInternal)) {
          setDashboardUrl("/dashboard")
        } else if (isAdmin && !isInternal) {
          setDashboardUrl("/admin-dashboard")
        } else {
          // Default to /dashboard for other cases
          setDashboardUrl("/users-dashboard")
        }
      } catch (error) {
        console.error("Error determining dashboard URL:", error)
        setDashboardUrl("/dashboard") // Default fallback
        setIsAdminWithInternalFalse(false)
      }
    }

    determineDashboardUrl()
  }, [user])

  const getUserInitials = () => {
    if (!user?.email) return "U"
    const name = (user as any)?.user_metadata?.full_name || user.email.split('@')[0]
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      console.log("Error signing out:", error)
      toast.error(`Error signing out: ${error.message}`)
    } else {
      toast.success("Successfully signed out")
      window.location.href = '/'
    }
  }

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
    <>
      {/* Floating Dynamic Edge Trigger */}
     <SidebarTrigger
        className={`
          fixed z-50 h-9 w-9
          transition-all duration-200
          bottom-4 left-4
          md:top-4 md:bottom-auto
          ${state === "collapsed" ? "md:left-4" : "md:left-[200px]"}
        `}
      />


      <Sidebar {...props} className="">
        <div className="p-4 border-b border-gray-200">
          <Image 
            src="/logo.png" 
            alt="Mechlin Logo"
            width={128}
            height={128}
            className=" h-10 w-auto"
          />
        </div>
        <SidebarContent className="gap-0">
          {SIDEBAR_NAVIGATION.map((item) => {
            // DASHBOARD Visibility (Checks any Organisation CRUD) [cite: 1]
            const canManageOrgs = hasPermission('organisations.read') || hasPermission('organisations.create') || hasPermission('organisations.update') || hasPermission('organisations.delete');

            // ORGANIZATION MANAGEMENT Visibility (Checks any Organisation CRUD) [cite: 1]
            // Hide for admin users with is_internal === false
            if (item.title === "Organization Management") {
              if (isAdminWithInternalFalse) {
                return null;
              }
              
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
            // Hide for admin users with is_internal === false
            if (item.title === "Project Management") {
              if (isAdminWithInternalFalse) {
                return null;
              }
              
              const canManageProjects = hasPermission('projects.create') || hasPermission('projects.update') || hasPermission('projects.delete') || hasPermission('projects.manage_members');
              
              if (!canManageProjects) {
                return null;
              }
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
              // For Dashboard, use the dynamically determined URL
              const url = item.title === "Dashboard" ? dashboardUrl : item.url
              const isActive = item.title === "Dashboard" 
                ? (pathname === "/dashboard" || pathname === "/admin-dashboard")
                : pathname === item.url

              return (
                <SidebarGroup key={item.title}>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive} className="font-medium py-3">
                        <Link href={url}>
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
        <SidebarFooter>
          <div className="p-1 border-t border-gray-200">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs border border-[2px] border-[#006AFF] text-[#006AFF]">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center text-red-600 cursor-pointer" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}