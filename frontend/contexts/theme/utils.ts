import { THEME_MODES, THEME_STORAGE_KEY, type ThemeMode } from "./constants";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function resolveTheme(stored: ThemeMode | null): ThemeMode {
  return stored ?? "light";
}

export function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function persistTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private browsing */
  }
}

export function oppositeTheme(theme: ThemeMode): ThemeMode {
  return theme === "dark" ? "light" : "dark";
}

export function cycleTheme(theme: ThemeMode): ThemeMode {
  const index = THEME_MODES.indexOf(theme);
  return THEME_MODES[(index + 1) % THEME_MODES.length] ?? "light";
}
