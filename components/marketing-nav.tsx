"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/leaderboard", label: "Model scores" },
  { href: "/benchmark", label: "Benchmarks" },
  { href: "/docs/benchmarks", label: "Model data" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
] as const;

type MarketingNavProps = {
  homeAnchors?: readonly { href: string; label: string }[];
  links?: readonly { href: string; label: string }[];
};

export function MarketingNav({ homeAnchors, links = NAV_LINKS }: MarketingNavProps = {}) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  function isActive(href: string) {
    if (href === "/docs") {
      return pathname === "/docs";
    }
    if (href === "/docs/benchmarks") {
      return pathname === "/docs/benchmarks" || pathname.startsWith("/docs/benchmarks/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="gp-topnav" aria-label="Primary navigation">
      <Link href="/" className="gp-nav__brand">
        <span className="gp-mark" aria-hidden="true">
          GP
        </span>
        <span>Ghost Palette</span>
      </Link>
      <div className="gp-topnav__right">
        <nav className="gp-topnav__links" aria-label="Site sections">
          {homeAnchors?.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
        {isLoaded && !isSignedIn ? (
          <Link className="gp-button gp-button--ghost" href="/sign-in">
            Sign in
          </Link>
        ) : null}
        <Link className="gp-button gp-button--primary" href="/studio">
          Open Studio
        </Link>
      </div>
    </header>
  );
}
