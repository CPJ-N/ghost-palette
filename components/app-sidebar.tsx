"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import {
  BookOpen,
  GalleryHorizontalEnd,
  Images,
  Library,
  LifeBuoy,
  Settings,
  SlidersHorizontal,
  Swords,
  Trophy,
  FlaskConical,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const workflows = [
  {
    title: "Composer",
    url: "/composer",
    icon: Images,
    description: "Bulk generation",
  },
  {
    title: "Arena",
    url: "/arena",
    icon: Swords,
    description: "Head-to-head judging",
  },
  {
    title: "Refine",
    url: "/evals",
    icon: SlidersHorizontal,
    description: "Edit and compare",
  },
];

const evaluation = [
  {
    title: "Live leaderboard",
    url: "/leaderboard",
    icon: Trophy,
    description: "ImageBench pass rates",
  },
  {
    title: "Run suite",
    url: "/benchmark",
    icon: FlaskConical,
    description: "ImageBench V1",
  },
  {
    title: "Industry data",
    url: "/docs/benchmarks",
    icon: BookOpen,
    description: "External rankings",
  },
  {
    title: "Library",
    url: "/library",
    icon: Library,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const support = [
  {
    title: "Docs",
    url: "/docs",
    icon: BookOpen,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Support",
    url: "mailto:hello@ghostpalette.app",
    icon: LifeBuoy,
  },
];

export function AppSidebar({
  ...props
}: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/leaderboard" aria-label="Ghost Palette evaluation">
                <span className="gp-mark" aria-hidden="true">
                  GP
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Ghost Palette</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Model evaluation
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Benchmarks" items={evaluation.slice(0, 3)} />
        <NavMain label="Workbench" items={workflows} />
        <NavMain label="Workspace" items={evaluation.slice(3)} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="gp-sidebar-note">
              <p>
                Run ImageBench on GP models, track live pass rates, and compare
                against industry reference data.
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary items={support} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
