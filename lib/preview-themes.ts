import type { CSSProperties } from "react";

/**
 * Each theme overrides the shadcn semantic tokens (--background, --card,
 * --primary, --border, ...) on a wrapper element. Because globals.css maps
 * those tokens through `@theme inline`, overriding them re-skins every real
 * shadcn component inside the wrapper — these previews are the actual app
 * chrome in each direction, not mockups.
 *
 * The chrome is STRICTLY monochrome (black / white / neutral grey, zero hue).
 * Hierarchy comes from contrast + weight, not color: --primary is the
 * high-contrast ink, the "winning model" gets a bright ring + a soft neutral
 * glow (--pv-glow), and CTAs use a near-flat neutral fill (--pv-gradient).
 * The only color on screen is the generated images themselves.
 */
export type PreviewTheme = {
  id: string;
  name: string;
  mode: string;
  blurb: string;
  swatches: string[];
  vars: CSSProperties;
};

function theme(
  id: string,
  name: string,
  mode: string,
  blurb: string,
  swatches: string[],
  vars: Record<string, string>
): PreviewTheme {
  return { id, name, mode, blurb, swatches, vars: vars as CSSProperties };
}

export const PREVIEW_THEMES: PreviewTheme[] = [
  theme(
    "obsidian",
    "Obsidian",
    "Dark · crisp",
    "Near-black, sharp white accent",
    ["#0A0A0A", "#161616", "#FAFAFA"],
    {
      "--background": "#0A0A0A",
      "--foreground": "#FAFAFA",
      "--card": "#161616",
      "--card-foreground": "#FAFAFA",
      "--popover": "#161616",
      "--popover-foreground": "#FAFAFA",
      "--secondary": "#1C1C1C",
      "--secondary-foreground": "#FAFAFA",
      "--muted": "#1C1C1C",
      "--muted-foreground": "#A3A3A3",
      "--accent": "#262626",
      "--accent-foreground": "#FAFAFA",
      "--border": "#272727",
      "--input": "#272727",
      "--radius": "0.75rem",
      "--primary": "#FAFAFA",
      "--primary-foreground": "#0A0A0A",
      "--ring": "#FAFAFA",
      "--pv-gradient": "linear-gradient(180deg, #FFFFFF, #E5E5E5)",
      "--pv-glow": "rgba(255,255,255,0.16)",
    }
  ),
  theme(
    "slate",
    "Slate",
    "Dark · soft",
    "Lifted greys, lower contrast — atmospheric",
    ["#171717", "#1F1F1F", "#D4D4D4"],
    {
      "--background": "#171717",
      "--foreground": "#EDEDED",
      "--card": "#1F1F1F",
      "--card-foreground": "#EDEDED",
      "--popover": "#1F1F1F",
      "--popover-foreground": "#EDEDED",
      "--secondary": "#262626",
      "--secondary-foreground": "#EDEDED",
      "--muted": "#262626",
      "--muted-foreground": "#8F8F8F",
      "--accent": "#2E2E2E",
      "--accent-foreground": "#EDEDED",
      "--border": "#2E2E2E",
      "--input": "#2E2E2E",
      "--radius": "0.875rem",
      "--primary": "#D4D4D4",
      "--primary-foreground": "#171717",
      "--ring": "#D4D4D4",
      "--pv-gradient": "linear-gradient(180deg, #E5E5E5, #BDBDBD)",
      "--pv-glow": "rgba(212,212,212,0.14)",
    }
  ),
  theme(
    "paper",
    "Paper",
    "Light · editorial",
    "Ink on paper, near-black accent",
    ["#FAFAFA", "#FFFFFF", "#171717"],
    {
      "--background": "#FAFAFA",
      "--foreground": "#171717",
      "--card": "#FFFFFF",
      "--card-foreground": "#171717",
      "--popover": "#FFFFFF",
      "--popover-foreground": "#171717",
      "--secondary": "#F5F5F5",
      "--secondary-foreground": "#171717",
      "--muted": "#F5F5F5",
      "--muted-foreground": "#737373",
      "--accent": "#ECECEC",
      "--accent-foreground": "#171717",
      "--border": "#E5E5E5",
      "--input": "#E5E5E5",
      "--radius": "0.75rem",
      "--primary": "#171717",
      "--primary-foreground": "#FAFAFA",
      "--ring": "#171717",
      "--pv-gradient": "linear-gradient(180deg, #2A2A2A, #0A0A0A)",
      "--pv-glow": "rgba(0,0,0,0.10)",
    }
  ),
  theme(
    "carbon",
    "Carbon",
    "Dark · stark",
    "Pure black & white, max contrast",
    ["#000000", "#0C0C0C", "#FFFFFF"],
    {
      "--background": "#000000",
      "--foreground": "#FFFFFF",
      "--card": "#0C0C0C",
      "--card-foreground": "#FFFFFF",
      "--popover": "#0C0C0C",
      "--popover-foreground": "#FFFFFF",
      "--secondary": "#161616",
      "--secondary-foreground": "#FFFFFF",
      "--muted": "#161616",
      "--muted-foreground": "#B5B5B5",
      "--accent": "#1C1C1C",
      "--accent-foreground": "#FFFFFF",
      "--border": "#333333",
      "--input": "#333333",
      "--radius": "0.5rem",
      "--primary": "#FFFFFF",
      "--primary-foreground": "#000000",
      "--ring": "#FFFFFF",
      "--pv-gradient": "linear-gradient(180deg, #FFFFFF, #D4D4D4)",
      "--pv-glow": "rgba(255,255,255,0.22)",
    }
  ),
];

export const PREVIEW_IDS = PREVIEW_THEMES.map((t) => t.id);

export function getTheme(id: string): PreviewTheme | undefined {
  return PREVIEW_THEMES.find((t) => t.id === id);
}
