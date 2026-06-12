"use client";

import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { themeAtom, themeReadyAtom } from "@/atoms/theme";
import { applyThemeClass } from "@/utils/theme/utils";

/** Keeps `document.documentElement` in sync with the persisted theme atom. */
export function ThemeSync() {
  const [theme] = useAtom(themeAtom);
  const setReady = useSetAtom(themeReadyAtom);

  useEffect(() => {
    applyThemeClass(theme);
    setReady(true);
  }, [theme, setReady]);

  return null;
}
