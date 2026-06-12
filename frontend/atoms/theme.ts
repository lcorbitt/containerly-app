"use client";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useCallback } from "react";
import { THEME_STORAGE_KEY, type ThemeMode } from "@/utils/theme/constants";
import { oppositeTheme } from "@/utils/theme/utils";

export const themeAtom = atomWithStorage<ThemeMode>(THEME_STORAGE_KEY, "light");

export const themeReadyAtom = atom(false);

export function useTheme() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(themeAtom);
  const ready = useAtomValue(themeReadyAtom);

  const toggleTheme = useCallback(() => {
    setTheme((current) => oppositeTheme(current));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme, ready };
}
