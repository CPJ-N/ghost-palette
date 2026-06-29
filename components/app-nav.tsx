"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Brush, LogOut, Library, Moon, Settings, SlidersHorizontal, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const PRIMARY = [
  { href: "/arena", label: "Create", icon: Brush },
  { href: "/evals", label: "Refine", icon: SlidersHorizontal },
];

const SECONDARY = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const initial = (
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    user?.firstName?.[0] ??
    "?"
  ).toUpperCase();

  return (
    <aside className="gp-rail" aria-label="App navigation">
      <Link href="/" className="gp-rail__brand">
        <span className="gp-mark" aria-hidden="true">
          GP
        </span>
        <span>Ghost Palette</span>
      </Link>

      <nav className="gp-rail__nav" aria-label="Features">
        {PRIMARY.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`gp-rail__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="gp-rail__foot">
        {SECONDARY.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`gp-rail__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="gp-rail__item"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle light and dark theme"
        >
          {!isDark ? (
            <Moon size={18} aria-hidden="true" />
          ) : (
            <Sun size={18} aria-hidden="true" />
          )}
          <span>{!isDark ? "Dark mode" : "Light mode"}</span>
        </button>
        <div className="gp-rail__account">
          <span className="gp-avatar" aria-hidden="true">
            {initial}
          </span>
          <button
            type="button"
            className="gp-rail__signout"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
