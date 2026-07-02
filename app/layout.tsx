import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: "900",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ghostpalette.app";
const SITE_DESCRIPTION =
  "Generate AI images and video side by side across FLUX, Stable Diffusion, Recraft, Seedream, Ideogram, Kling, Luma and more — one prompt, every model, compared in the same light.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ghost Palette — Compare AI Image & Video Models Side by Side",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  keywords: [
    "AI image generator",
    "AI video generator",
    "compare AI models",
    "FLUX",
    "Stable Diffusion",
    "Recraft",
    "Seedream",
    "Ideogram",
    "Kling",
    "Luma Dream Machine",
    "text to image",
    "text to video",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ghost Palette",
    title: "Ghost Palette — Compare AI Image & Video Models Side by Side",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Palette — Compare AI Image & Video Models Side by Side",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClerkProvider>
            <TooltipProvider delayDuration={800}>{children}</TooltipProvider>
            <CookieConsent />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
