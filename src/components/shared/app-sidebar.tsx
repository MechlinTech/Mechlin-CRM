"use client"
import * as React from "react"
import { ChevronRight, LayoutGrid, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
import { Button } from "@/components/ui/button"
import { SIDEBAR_NAVIGATION } from "@/config/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  // FIX: Prevents hydration mismatch by waiting for client-side mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      console.log("Error signing out:", error)
      toast.error(`Error signing out: ${error.message}`)
    } else {
      toast.success("Successfully signed out")
      router.push('/')
    }
  }

  if (!mounted) {
    return (
      <Sidebar {...props}>
        <SidebarHeader><h2 className="text-2xl font-bold text-center py-4">Mechlin CRM</h2></SidebarHeader>
        <SidebarContent />
      </Sidebar>
    )
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <h2 className="text-2xl font-bold text-center py-4">Mechlin CRM</h2>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {SIDEBAR_NAVIGATION.map((item) => {
          const isDirectLink = item.url && (!item.items || item.items.length === 0);

          if (isDirectLink) {
            return (
              <SidebarGroup key={item.title}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === item.url} className="font-medium py-6">
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
      </SidebarContent>
      {/* Logout Section */}
      <SidebarGroup className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarRail />
    </Sidebar>
  )
}