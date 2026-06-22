"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FlaskConical,
  LayoutGrid,
  Trophy,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const LIVE_EVAL_NAV: {
  title: string;
  url: string;
  icon: LucideIcon;
}[] = [
  { title: "Live leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Run suite", url: "/benchmark", icon: FlaskConical },
];

const DOCS_NAV: {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    title: "Overview",
    url: "/docs",
    icon: LayoutGrid,
    description: "Evaluation docs — live scores, industry data, methodology.",
  },
  {
    title: "Industry benchmarks",
    url: "/docs/benchmarks",
    icon: BookOpen,
    description: "External rankings and benchmark glossary.",
  },
  {
    title: "ImageBench V1",
    url: "/docs/imagebench",
    icon: Trophy,
    description: "Published ImageBench methodology and leaderboard reference.",
  },
  {
    title: "Methodology",
    url: "/docs/methodology",
    icon: FlaskConical,
    description: "Fair comparison rules for Arena and Refine workflows.",
  },
];

function currentSection(pathname: string) {
  if (pathname === "/docs") {
    return DOCS_NAV[0];
  }
  return (
    DOCS_NAV.find(
      (item) =>
        item.url !== "/docs" &&
        (pathname === item.url || pathname.startsWith(`${item.url}/`)),
    ) ?? DOCS_NAV[0]
  );
}

function isActive(pathname: string, url: string) {
  if (url === "/docs") {
    return pathname === "/docs";
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = currentSection(pathname);

  return (
    <div className="gp-docs">
      <SidebarProvider className="gp-docs__provider">
        <Sidebar collapsible="none" className="gp-docs__nav hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Ghost Palette scores</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {LIVE_EVAL_NAV.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Documentation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {DOCS_NAV.map((item) => {
                    const active = isActive(pathname, item.url);
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
        <div className="gp-docs__main">
          <header className="gp-docs__head">
            <nav className="gp-docs__mobile" aria-label="Documentation sections">
              {LIVE_EVAL_NAV.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className="gp-docs__mobile-link"
                >
                  <item.icon size={15} aria-hidden="true" />
                  {item.title}
                </Link>
              ))}
              {DOCS_NAV.map((item) => {
                const active = isActive(pathname, item.url);
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className="gp-docs__mobile-link"
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
                    <Link href="/docs">Docs</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== "/docs" ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{section.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : null}
              </BreadcrumbList>
            </Breadcrumb>
            <p className="gp-docs__lede">{section.description}</p>
          </header>
          <div className="gp-docs__body">{children}</div>
        </div>
      </SidebarProvider>
    </div>
  );
}
