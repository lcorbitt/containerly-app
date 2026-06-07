"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AUTHENTICATED_APP_SHELL_MAIN_SCROLL_SELECTOR } from "../AuthenticatedAppShell/constants";

export interface AuthenticatedMainPaneOverlayBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolveMainScrollContainer(root: HTMLElement | null): HTMLElement | null {
  const marked = root?.closest(AUTHENTICATED_APP_SHELL_MAIN_SCROLL_SELECTOR);
  return marked instanceof HTMLElement ? marked : null;
}

export function useAuthenticatedMainPaneOverlay(
  rootRef: RefObject<HTMLElement | null>,
  active: boolean,
): AuthenticatedMainPaneOverlayBounds | null {
  const [bounds, setBounds] = useState<AuthenticatedMainPaneOverlayBounds | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const updateBounds = useCallback(() => {
    const main = resolveMainScrollContainer(rootRef.current);
    scrollContainerRef.current = main;
    if (!main) {
      setBounds(null);
      return;
    }
    const rect = main.getBoundingClientRect();
    setBounds({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [rootRef]);

  useLayoutEffect(() => {
    if (!active) {
      setBounds(null);
      return;
    }

    updateBounds();

    const main = scrollContainerRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && main
        ? new ResizeObserver(() => updateBounds())
        : null;
    resizeObserver?.observe(main!);

    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, true);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds, true);
    };
  }, [active, updateBounds]);

  useEffect(() => {
    const main = scrollContainerRef.current;
    if (!main || !active) return;

    const previousOverflow = main.style.overflow;
    main.style.overflow = "hidden";

    return () => {
      main.style.overflow = previousOverflow;
    };
  }, [active, bounds]);

  return active ? bounds : null;
}
