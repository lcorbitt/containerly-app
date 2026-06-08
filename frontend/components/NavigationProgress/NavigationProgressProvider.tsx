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
  NAVIGATION_PROGRESS_GATE_GRACE_MS,
  NAVIGATION_PROGRESS_HIDDEN_CLASS,
  NAVIGATION_PROGRESS_SAFETY_MS,
  NAVIGATION_PROGRESS_SHELL_CLASS,
  NAVIGATION_PROGRESS_SHOW_DELAY_MS,
  NAVIGATION_PROGRESS_TRACK_CLASS,
} from "./constants";
import { resolveNavigationLoadingText, navigationStartInputFromAnchor } from "./resolve-navigation-start";
import type { NavigationStartInput } from "./resolve-navigation-start";
import type { NavigationProgressContextValue, NavigationProgressPhase } from "./types";
import { shouldStartNavigationFromAnchor } from "./utils";

export const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(
  null,
);

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<NavigationProgressPhase>("idle");
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const graceTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const pendingStartRef = useRef(false);
  // How many destination components are holding the overlay open until their data is ready.
  const gateCountRef = useRef(0);
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

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current != null) {
      window.clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current != null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishNavigation = useCallback(() => {
    clearShowTimer();
    clearGraceTimer();
    clearSafetyTimer();
    pendingStartRef.current = false;
    setPendingNavigation(false);
    setLoadingText(null);
    setPhase((current) => {
      if (current === "idle") return "idle";
      return "completing";
    });
    clearCompleteTimer();
    completeTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      completeTimerRef.current = null;
    }, NAVIGATION_PROGRESS_COMPLETE_MS);
  }, [clearCompleteTimer, clearGraceTimer, clearSafetyTimer, clearShowTimer]);

  const startNavigation = useCallback((input?: NavigationStartInput) => {
    pendingStartRef.current = true;
    setPendingNavigation(true);
    setLoadingText(resolveNavigationLoadingText(input));
    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      if (!pendingStartRef.current) return;
      setPhase("active");
      showTimerRef.current = null;
    }, NAVIGATION_PROGRESS_SHOW_DELAY_MS);
    // Safety net: a destination that never reports ready can't pin the overlay open forever.
    clearSafetyTimer();
    safetyTimerRef.current = window.setTimeout(() => {
      finishNavigation();
    }, NAVIGATION_PROGRESS_SAFETY_MS);
  }, [clearSafetyTimer, clearShowTimer, finishNavigation]);

  const claimContentGate = useCallback(() => {
    gateCountRef.current += 1;
    // A page now owns finishing the overlay (on ready / safety), so cancel the route-commit
    // fallback that would otherwise close it early.
    clearGraceTimer();
  }, [clearGraceTimer]);

  const releaseContentGate = useCallback(
    ({ ready }: { ready: boolean }) => {
      if (gateCountRef.current > 0) gateCountRef.current -= 1;
      // Finish only once the destination's data is ready and no other gate is still holding.
      if (ready && gateCountRef.current === 0 && pendingStartRef.current) {
        finishNavigation();
      }
    },
    [finishNavigation],
  );

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    // Untracked navigation (browser back/forward, programmatic without startNavigation): just clear.
    if (!pendingStartRef.current) {
      finishNavigation();
      return;
    }

    // Route committed. If the destination already claimed the content gate, keep the overlay up
    // until it reports ready. Otherwise give it a brief window to mount and claim before closing.
    if (gateCountRef.current > 0) return;
    clearGraceTimer();
    graceTimerRef.current = window.setTimeout(() => {
      graceTimerRef.current = null;
      if (gateCountRef.current > 0) return;
      finishNavigation();
    }, NAVIGATION_PROGRESS_GATE_GRACE_MS);
  }, [clearGraceTimer, finishNavigation, pathname]);

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

      startNavigation(navigationStartInputFromAnchor(anchor));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startNavigation]);

  useEffect(
    () => () => {
      clearShowTimer();
      clearCompleteTimer();
      clearGraceTimer();
      clearSafetyTimer();
    },
    [clearCompleteTimer, clearGraceTimer, clearSafetyTimer, clearShowTimer],
  );

  const value = useMemo<NavigationProgressContextValue>(
    () => ({
      phase,
      isNavigating: pendingNavigation || phase !== "idle",
      loadingText,
      startNavigation,
      claimContentGate,
      releaseContentGate,
    }),
    [claimContentGate, loadingText, pendingNavigation, phase, releaseContentGate, startNavigation],
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
