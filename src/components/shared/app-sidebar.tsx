"use client"
import * as React from "react"
import { ChevronRight, LayoutGrid, Target, Zap } from "lucide-react"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

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
      setLoading(false)
    }
    
    if (isProjectsPage) {
      fetchProjectHierarchy()
    }
  }, [isProjectsPage])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Sidebar {...props} className="pt-10 overflow-y-hidden">
        <SidebarContent />
      </Sidebar>
    )
  }

  const renderProjectHierarchy = () => {
    // Don't show anything if not on a specific project page
    if (!isProjectsPage) {
      return null
    }

    if (loading) {
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

    // Get current project from URL if we're on a specific project page
    const currentProjectId = pathname.match(/\/projects\/([a-f0-9-]+)(?:\/phases\/[a-f0-9-]+\/milestones\/[a-f0-9-]+\/sprints\/[a-f0-9-]+)?/)?.[1]
    const currentProject = projects.find(p => p.id === currentProjectId)

    if (!currentProject) {
      return null // Don't show project section if no specific project is open
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
                          <Target className="mr-2 h-3 w-3 text-orange-500" />
                          <span>{phase.name}</span>
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
                                    <Zap className="mr-2 h-3 w-3 text-yellow-500" />
                                    <span>{milestone.name}</span>
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
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
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
        {/* Show existing navigation */}
        {SIDEBAR_NAVIGATION.map((item) => {
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
                  <CollapsibleTrigger>
                    {item.title}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
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
        
        {/* Show project hierarchy if on a specific project page */}
        {renderProjectHierarchy()}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}