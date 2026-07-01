"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";

export function SettingsAppearanceContent() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    posthog.capture("theme_changed", { theme: next });
  }

  return (
    <section className="gp-settings-panel">
      <h2>Appearance</h2>
      <p className="gp-settings-copy">
        Ghost Palette uses an Ink Workbench palette — neutral black and white
        surfaces with Geist typography. Theme follows system preference by default.
      </p>
      <div className="gp-settings-actions">
        <Button
          variant="outline"
          onClick={toggleTheme}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          Switch to {isDark ? "light" : "dark"} mode
        </Button>
      </div>
      <p className="gp-settings-note">
        Current theme: {isDark ? "dark" : "light"}. The UI stays strictly
        monochrome — ink on paper, no chromatic accents.
      </p>
    </section>
  );
}
