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
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Suite",
    url: "/benchmark",
    icon: FlaskConical,
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
              <Link href="/composer" aria-label="Open Ghost Palette Composer">
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
        <NavMain label="Workflows" items={workflows} />
        <NavMain label="Evaluation" items={evaluation} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="gp-sidebar-note">
              <p>Compare models, pick winners, then refine the strongest output.</p>
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
