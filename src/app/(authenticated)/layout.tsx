  import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="pt-10">
        <SidebarProvider className="min-h-auto">
          <AppSidebar />
          <SidebarInset className="p-4 h-[calc(100vh-2.5rem)] overflow-y-auto">
            {/* Fixed Toggle Button - Always Visible */}
            <div className="fixed left-1 bottom-3 z-50">
              <SidebarTrigger className="h-10 w-10 bg-white shadow-lg border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200" />
            </div>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}