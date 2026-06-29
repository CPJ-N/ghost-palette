"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComposerRoute = pathname === "/arena" || pathname.startsWith("/arena/");

  if (isComposerRoute) {
    return (
      <div className="gp-app gp-app--composer">
        <main className="gp-appmain gp-appmain--composer">{children}</main>
      </div>
    );
  }

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
