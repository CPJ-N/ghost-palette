"use client";

import * as React from "react";
import {
  BadgeCheckIcon,
  CreditCardIcon,
  GaugeIcon,
  PaintbrushIcon,
  PlugIcon,
} from "lucide-react";

import { SettingsAccountContent } from "@/components/settings-account-content";
import { SettingsAppearanceContent } from "@/components/settings-appearance-content";
import { SettingsBillingContent } from "@/components/settings-billing-content";
import { SettingsProvidersContent } from "@/components/settings-providers-content";
import { SettingsUsageContent } from "@/components/settings-usage-content";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

const SECTIONS = [
  { name: "Account", icon: BadgeCheckIcon, Content: SettingsAccountContent },
  { name: "Usage", icon: GaugeIcon, Content: SettingsUsageContent },
  { name: "Billing", icon: CreditCardIcon, Content: SettingsBillingContent },
  { name: "Appearance", icon: PaintbrushIcon, Content: SettingsAppearanceContent },
  { name: "Providers", icon: PlugIcon, Content: SettingsProvidersContent },
] as const;

type SectionName = (typeof SECTIONS)[number]["name"];

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [active, setActive] = React.useState<SectionName>("Account");

  React.useEffect(() => {
    if (open) setActive("Account");
  }, [open]);

  const ActiveContent =
    SECTIONS.find((s) => s.name === active)?.Content ?? SettingsAccountContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 w-[calc(100vw-2rem)] sm:max-w-[680px] md:max-h-[540px] md:max-w-[780px] lg:max-w-[880px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your account, appearance, billing, and providers.
        </DialogDescription>
        <SidebarProvider className="items-start gp-settings-dialog">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SECTIONS.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          type="button"
                          isActive={item.name === active}
                          onClick={() => setActive(item.name)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <div className="flex h-[540px] flex-1 flex-col overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
              {SECTIONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActive(item.name)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                    item.name === active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </button>
              ))}
            </div>
            <main className="flex-1 overflow-y-auto p-6">
              <React.Suspense fallback={null}>
                <ActiveContent />
              </React.Suspense>
            </main>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
