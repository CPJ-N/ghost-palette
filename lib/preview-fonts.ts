import {
  Geist,
  Geist_Mono,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Nunito_Sans,
  Space_Grotesk,
} from "next/font/google";

// Candidate families — loaded only where `fontVarsClass` is applied (the font
// preview page), so they never ship with the rest of the app.
const geist = Geist({ subsets: ["latin"], variable: "--pf-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--pf-geist-mono" });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: "900", variable: "--pf-nunito" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--pf-space-grotesk" });
const inter = Inter({ subsets: ["latin"], variable: "--pf-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--pf-jetbrains" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--pf-instrument",
});

export const fontVarsClass = [
  geist,
  geistMono,
  nunito,
  spaceGrotesk,
  inter,
  jetbrains,
  instrument,
]
  .map((f) => f.variable)
  .join(" ");

export type FontSet = {
  id: string;
  name: string;
  note: string;
  vars: { display: string; body: string; mono: string; wordmark: string };
  names: { display: string; body: string; mono: string; wordmark: string };
};

export const FONT_SETS: FontSet[] = [
  {
    id: "geist",
    name: "Geist",
    note: "Clean, technical · current",
    vars: {
      display: "var(--pf-geist)",
      body: "var(--pf-geist)",
      mono: "var(--pf-geist-mono)",
      wordmark: "var(--pf-nunito)",
    },
    names: {
      display: "Geist",
      body: "Geist",
      mono: "Geist Mono",
      wordmark: "Nunito Sans",
    },
  },
  {
    id: "grotesk",
    name: "Space Grotesk + Inter",
    note: "Geometric, distinctive",
    vars: {
      display: "var(--pf-space-grotesk)",
      body: "var(--pf-inter)",
      mono: "var(--pf-jetbrains)",
      wordmark: "var(--pf-space-grotesk)",
    },
    names: {
      display: "Space Grotesk",
      body: "Inter",
      mono: "JetBrains Mono",
      wordmark: "Space Grotesk",
    },
  },
  {
    id: "editorial",
    name: "Instrument Serif + Inter",
    note: "Editorial, premium",
    vars: {
      display: "var(--pf-instrument)",
      body: "var(--pf-inter)",
      mono: "var(--pf-jetbrains)",
      wordmark: "var(--pf-instrument)",
    },
    names: {
      display: "Instrument Serif",
      body: "Inter",
      mono: "JetBrains Mono",
      wordmark: "Instrument Serif",
    },
  },
  {
    id: "inter",
    name: "Inter",
    note: "Neutral, ultra-legible",
    vars: {
      display: "var(--pf-inter)",
      body: "var(--pf-inter)",
      mono: "var(--pf-jetbrains)",
      wordmark: "var(--pf-inter)",
    },
    names: {
      display: "Inter",
      body: "Inter",
      mono: "JetBrains Mono",
      wordmark: "Inter",
    },
  },
];
