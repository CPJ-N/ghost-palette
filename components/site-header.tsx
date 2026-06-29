"use client";

import { usePathname } from "next/navigation";
import { BadgeCheck } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCredits } from "@/hooks/use-credits";

const ROUTES: Record<string, { title: string; description: string }> = {
  "/studio": {
    title: "Create",
    description: "Generate images and compare models when the brief needs it.",
  },
  "/evals": {
    title: "Refine",
    description: "Chat-driven edits with split before/after compare.",
  },
  "/library": {
    title: "Library",
    description: "Saved runs, winners, and comparison history.",
  },
  "/settings": {
    title: "Settings",
    description: "Plan, credits, provider setup, and account details.",
  },
  "/settings/account": {
    title: "Settings",
    description: "Profile, sign-in, and account details.",
  },
  "/settings/billing": {
    title: "Settings",
    description: "Plan, credits, and Stripe checkout.",
  },
  "/settings/providers": {
    title: "Settings",
    description: "Model provider keys and endpoints.",
  },
  "/settings/appearance": {
    title: "Settings",
    description: "Theme and display preferences.",
  },
};

function currentRoute(pathname: string) {
  const match = Object.keys(ROUTES)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));

  return match ? ROUTES[match] : ROUTES["/studio"];
}

export function SiteHeader() {
  const pathname = usePathname();
  const route = currentRoute(pathname);
  const { credits } = useCredits();

  return (
    <header className="gp-appheader">
      <div className="gp-appheader__left">
        <SidebarTrigger className="gp-sidebar-trigger" />
        <Separator orientation="vertical" className="gp-appheader__rule" />
        <div className="gp-appheader__title">
          <strong>{route.title}</strong>
          <span>{route.description}</span>
        </div>
      </div>
      <div className="gp-appheader__right">
        <span className="gp-appheader__status">
          <BadgeCheck size={15} aria-hidden="true" />
          {credits ? `${credits.balance} credits` : "Image studio"}
        </span>
      </div>
    </header>
  );
}
