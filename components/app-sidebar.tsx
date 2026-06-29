"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brush,
  Library,
  LifeBuoy,
  Settings,
  SlidersHorizontal,
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
    title: "Create",
    url: "/studio",
    icon: Brush,
    description: "Generate and compare images",
  },
  {
    title: "Refine",
    url: "/evals",
    icon: SlidersHorizontal,
    description: "Edit from a reference",
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
              <Link href="/studio" aria-label="Ghost Palette studio">
                <span className="gp-mark" aria-hidden="true">
                  GP
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Ghost Palette</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Image studio
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Studio" items={workflows} />
        <NavMain label="Model intelligence" items={evaluation.slice(0, 3)} />
        <NavMain label="Workspace" items={evaluation.slice(3)} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="gp-sidebar-note">
              <p>
                Create images first. Use scores and benchmarks when the model
                choice matters.
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
