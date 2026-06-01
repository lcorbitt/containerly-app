"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme/ThemeProvider";
import { THEME_TOGGLE_BUTTON_CLASS, THEME_TOGGLE_MARKETING_BUTTON_CLASS } from "./constants";

export function ThemeToggle({ variant = "app" }: { variant?: "app" | "marketing" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const className = variant === "marketing" ? THEME_TOGGLE_MARKETING_BUTTON_CLASS : THEME_TOGGLE_BUTTON_CLASS;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      suppressHydrationWarning
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
