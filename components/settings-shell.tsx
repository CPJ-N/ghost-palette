"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CreditCard,
  KeyRound,
  Palette,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const SETTINGS_NAV: {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    title: "Account",
    url: "/settings/account",
    icon: BadgeCheck,
    description: "Profile and sign-in",
  },
  {
    title: "Billing",
    url: "/settings/billing",
    icon: CreditCard,
    description: "Plan, credits, and checkout",
  },
  {
    title: "Providers",
    url: "/settings/providers",
    icon: KeyRound,
    description: "Model provider keys",
  },
  {
    title: "Appearance",
    url: "/settings/appearance",
    icon: Palette,
    description: "Theme and display",
  },
];

function currentSection(pathname: string) {
  return (
    SETTINGS_NAV.find(
      (item) =>
        pathname === item.url || pathname.startsWith(`${item.url}/`),
    ) ?? SETTINGS_NAV[0]
  );
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = currentSection(pathname);

  return (
    <div className="gp-settings">
      <SidebarProvider className="gp-settings__provider">
        <Sidebar
          collapsible="none"
          className="gp-settings__nav hidden md:flex"
        >
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SETTINGS_NAV.map((item) => {
                    const active =
                      pathname === item.url ||
                      pathname.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link
                            href={item.url}
                            aria-current={active ? "page" : undefined}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="gp-settings__main">
          <header className="gp-settings__head">
            <nav className="gp-settings__mobile" aria-label="Settings sections">
              {SETTINGS_NAV.map((item) => {
                const active =
                  pathname === item.url ||
                  pathname.startsWith(`${item.url}/`);
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className="gp-settings__mobile-link"
                    data-active={active ? "" : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon size={15} aria-hidden="true" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/settings">Settings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{section.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="gp-settings__lede">{section.description}</p>
          </header>
          <div className="gp-settings__body">{children}</div>
        </div>
      </SidebarProvider>
    </div>
  );
}
