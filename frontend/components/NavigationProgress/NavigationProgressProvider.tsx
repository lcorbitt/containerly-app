"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  NAVIGATION_PROGRESS_ACTIVE_CLASS,
  NAVIGATION_PROGRESS_COMPLETING_CLASS,
  NAVIGATION_PROGRESS_COMPLETE_MS,
  NAVIGATION_PROGRESS_HIDDEN_CLASS,
  NAVIGATION_PROGRESS_SHELL_CLASS,
  NAVIGATION_PROGRESS_SHOW_DELAY_MS,
  NAVIGATION_PROGRESS_TRACK_CLASS,
} from "./constants";
import {
  buildNavigationLoadingText,
  navigationEntityLabelFromAnchor,
} from "./navigation-entity-label";
import type { NavigationProgressContextValue, NavigationProgressPhase } from "./types";
import { shouldStartNavigationFromAnchor } from "./utils";

export const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(
  null,
);

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<NavigationProgressPhase>("idle");
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const pendingStartRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current != null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const finishNavigation = useCallback(() => {
    clearShowTimer();
    pendingStartRef.current = false;
    setPendingNavigation(false);
    setDestinationLabel(null);
    setPhase((current) => {
      if (current === "idle") return "idle";
      return "completing";
    });
    clearCompleteTimer();
    completeTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      completeTimerRef.current = null;
    }, NAVIGATION_PROGRESS_COMPLETE_MS);
  }, [clearCompleteTimer, clearShowTimer]);

  const startNavigation = useCallback((label?: string) => {
    pendingStartRef.current = true;
    setPendingNavigation(true);
    setDestinationLabel(label?.trim() ? label.trim() : null);
    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      if (!pendingStartRef.current) return;
      setPhase("active");
      showTimerRef.current = null;
    }, NAVIGATION_PROGRESS_SHOW_DELAY_MS);
  }, [clearShowTimer]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    finishNavigation();
  }, [finishNavigation, pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!shouldStartNavigationFromAnchor(anchor)) return;

      startNavigation(navigationEntityLabelFromAnchor(anchor));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startNavigation]);

  useEffect(
    () => () => {
      clearShowTimer();
      clearCompleteTimer();
    },
    [clearCompleteTimer, clearShowTimer],
  );

  const loadingText = destinationLabel ? buildNavigationLoadingText(destinationLabel) : null;

  const value = useMemo<NavigationProgressContextValue>(
    () => ({
      phase,
      isNavigating: pendingNavigation || phase !== "idle",
      destinationLabel,
      loadingText,
      startNavigation,
    }),
    [destinationLabel, loadingText, pendingNavigation, phase, startNavigation],
  );

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
      <NavigationProgressBar phase={phase} />
    </NavigationProgressContext.Provider>
  );
}

function NavigationProgressBar({ phase }: { phase: NavigationProgressPhase }) {
  const trackClassName =
    phase === "active"
      ? `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_ACTIVE_CLASS}`
      : phase === "completing"
        ? `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_COMPLETING_CLASS} scale-x-100`
        : `${NAVIGATION_PROGRESS_TRACK_CLASS} ${NAVIGATION_PROGRESS_HIDDEN_CLASS}`;

  return (
    <div
      className={NAVIGATION_PROGRESS_SHELL_CLASS}
      role="progressbar"
      aria-hidden={phase === "idle"}
      aria-busy={phase !== "idle"}
    >
      <div className={trackClassName} />
    </div>
  );
}
