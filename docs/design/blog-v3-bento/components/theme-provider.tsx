"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

const ACCENTS = ["orange", "blue", "green", "violet", "magenta"] as const;
export type Accent = typeof ACCENTS[number];

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AccentSync />
      {children}
    </NextThemesProvider>
  );
}

// Reads localStorage on mount and stamps `data-accent` on <html>.
// Plays nicely with the AccentSwitcher below.
function AccentSync() {
  useEffect(() => {
    const a = (localStorage.getItem("bento-accent") || "orange") as Accent;
    document.documentElement.setAttribute("data-accent", a);
  }, []);
  return null;
}

export function setAccent(a: Accent) {
  localStorage.setItem("bento-accent", a);
  document.documentElement.setAttribute("data-accent", a);
}

export function getAccent(): Accent {
  if (typeof document === "undefined") return "orange";
  return (document.documentElement.getAttribute("data-accent") || "orange") as Accent;
}

export { ACCENTS };
