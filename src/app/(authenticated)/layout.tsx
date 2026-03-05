import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RBACProvider } from "@/context/rbac-context";
import { RBACWatcher } from "@/components/custom/rbac/rbac-watcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RBACProvider>
      <RBACWatcher />
      <SidebarProvider className="min-h-auto">
        <AppSidebar />
        <SidebarInset className="p-4 h-[calc(100vh-2.5rem)] overflow-y-auto custom-scrollbar">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RBACProvider>
  );
}