"use client";

import { useState } from "react";
import type { Theme } from "@/lib/theme";

/**
 * Slider switch. Toggles the theme instantly (data-theme on <html>) and
 * persists it in a cookie so the server renders the same theme next visit.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${theme}`}
      onClick={toggle}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      aria-label="Toggle theme"
    >
      <span className="knob">{theme === "dark" ? "\u263e" : "\u2600"}</span>
    </button>
  );
}
