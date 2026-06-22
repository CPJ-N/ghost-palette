"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export default function SettingsAppearancePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

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
          onClick={() => setTheme(isDark ? "light" : "dark")}
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
