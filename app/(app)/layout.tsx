import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Routes here are gated by proxy.ts for generation workflows. The shadcn sidebar is
// the workspace frame for Arena, Refine, Library, and Settings.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="gp-app">
      <AppSidebar />
      <SidebarInset className="gp-app__inset">
        <SiteHeader />
        <div className="gp-appmain">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
