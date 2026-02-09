  import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="pt-10">
        <SidebarProvider className="min-h-auto">
          <AppSidebar />
          <SidebarInset className="p-4 h-[calc(100vh-2.5rem)] overflow-y-auto">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}