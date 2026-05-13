"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ACCENTS, type Accent, setAccent, getAccent } from "./theme-provider";
import { CommandK } from "./command-k";

const NAV = [
  { name: "Home", href: "/" },
  { name: "Posts", href: "/posts" },
  { name: "Series", href: "/series" },
  { name: "Tags", href: "/tags" },
];

export function Header({ active = "Home" }: { active?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accent, setAccentState] = useState<Accent>("orange");
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAccentState(getAccent());
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="mx-auto flex max-w-canvas items-center justify-between gap-4 px-10 pb-7 pt-8">
        <Link href="/" className="flex items-center gap-3 no-underline text-ink">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-base font-bold text-white">
            F
          </div>
          <div className="text-base font-semibold">
            frank<span className="text-dim">.blog</span>
          </div>
        </Link>

        <nav className="flex gap-1 rounded-full bg-ink/[0.06] p-1 dark:bg-white/10">
          {NAV.map((n) => {
            const isActive = n.name === active;
            return (
              <Link
                key={n.name}
                href={n.href}
                className={[
                  "rounded-full px-4 py-1.5 text-[13px] font-medium no-underline transition",
                  isActive
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-ink hover:bg-ink/5 dark:text-white",
                ].join(" ")}
              >
                {n.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setCmdkOpen(true)}
            className="flex items-center gap-2.5 rounded-full bg-ink/[0.06] px-3.5 py-2 text-[13px] text-dim transition hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
            aria-label="Search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            {mounted && (
              <kbd className="hidden rounded border border-ink/10 bg-card px-1.5 py-0 font-mono text-[10px] font-semibold text-ink sm:inline dark:border-white/10">
                {isMac ? "⌘" : "Ctrl"}K
              </kbd>
            )}
          </button>

          {/* Accent picker */}
          {mounted && (
            <div className="flex gap-1 rounded-full bg-ink/[0.06] p-1 dark:bg-white/10">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  aria-label={`Accent ${a}`}
                  onClick={() => {
                    setAccent(a);
                    setAccentState(a);
                  }}
                  className={[
                    "h-5 w-5 rounded-full border transition",
                    accent === a ? "ring-2 ring-ink dark:ring-white" : "border-transparent",
                  ].join(" ")}
                  style={{
                    background: {
                      orange: "#FF5B22",
                      blue: "#3B5BFF",
                      green: "#16A968",
                      violet: "#7C3AED",
                      magenta: "#E91E63",
                    }[a],
                  }}
                />
              ))}
            </div>
          )}

          {/* Dark mode toggle */}
          {mounted && (
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-ink transition hover:bg-ink/10 dark:bg-white/10 dark:text-white"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          )}

          <button className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white dark:bg-white dark:text-ink">
            RSS
          </button>
        </div>
      </header>

      <CommandK open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
    </>
  );
}
