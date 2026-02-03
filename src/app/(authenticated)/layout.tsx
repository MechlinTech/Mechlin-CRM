  import { AppSidebar } from "@/components/shared/app-sidebar";
  import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

  export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
      return (
          <SidebarProvider className="min-h-auto">
              <AppSidebar />
              <SidebarInset className="p-4">
                  {children}
              </SidebarInset>
          </SidebarProvider>
      );
    }