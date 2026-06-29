import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Single app shell for every workspace route (Create/studio, Refine, Library,
// Settings) — sidebar + header + content area, so the studio matches the rest.
export function AppFrame({ children }: { children: React.ReactNode }) {
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
